'use client';

import { useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { bookmarkApi } from '@/entities/bookmark';
import { List, Search, MapPin, X, SlidersHorizontal, ChevronDown, Filter } from 'lucide-react';
import { useAuthSession } from '@/features/auth/model';
import { LoginRequiredModal } from '@/shared/ui/login-required-modal/login-required-modal';
import { PropertyMap, type PropertyLocation } from '@/shared/ui/property-map';
import type { ViewMode } from '@/shared/ui/property-filters';
import {
  propertyQueries,
  type PropertyListingDto,
  type PropertySearchRequest,
} from '@/entities/property';
import { formatVND } from '@/shared/lib/utils/format-currency';
import { cn } from '@/shared/lib/utils';
import { PropertyFiltersModal, type PropertyFilters as PropertyFilterValues, type RentalPeriod } from '@/shared/ui/property-filters-modal';
import { HCM_CITY_CENTER } from '@/shared/constants';
import { FLAT_PROPERTY_TYPES } from '@/shared/config/property-types';
import { SearchListingResults } from './search-listing-results';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { VndAmountInput } from '@/shared/ui/vnd-amount-input/vnd-amount-input';
import { Label } from '@/shared/ui/label/label';
import { Button } from '@/shared/ui/button/button';

// Default filter values
const DEFAULT_FILTERS: PropertyFilterValues = {
  priceRange: { min: 0, max: 20000000000 },
  rentalPeriod: 'any',
  attributes: {},
};

const sortOptions = [
  { label: 'Mới nhất', value: 'NEWEST' },
  { label: 'Giá thấp đến cao', value: 'PRICE_ASC' },
  { label: 'Giá cao đến thấp', value: 'PRICE_DESC' },
  { label: 'Ưu tiên', value: 'PRIORITY' },
];

export interface PropertyMapBasedSearchPageProps {
  initialListingType?: 'RENT' | 'SALE';
  onBack?: () => void;
}

export function PropertyMapBasedSearchPage({
  initialListingType,
  onBack,
}: PropertyMapBasedSearchPageProps) {
  const t = useTranslations('PropertySearch');
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const propertyType = searchParams?.get('propertyType');

  const [filters, setFilters] = useState<PropertyFilterValues>(() => {
    const minPrice = searchParams?.get('minPrice');
    const maxPrice = searchParams?.get('maxPrice');
    const rentalPeriod = searchParams?.get('rentalPeriod') as RentalPeriod | null;

    // Extract dynamic attributes from URL (attr_xxx)
    const attributes: Record<string, number | boolean | string | undefined> = {};
    searchParams?.forEach((value, key) => {
      if (key.startsWith('attr_')) {
        const attrKey = key.slice(5).toUpperCase();
        // Try to parse as number or boolean
        if (value === 'true') attributes[attrKey] = true;
        else if (value === 'false') attributes[attrKey] = false;
        else if (!isNaN(Number(value))) attributes[attrKey] = Number(value);
        else attributes[attrKey] = value;
      }
    });

    // Special case for legacy bedrooms/bathrooms if they exist in URL
    const bedrooms = searchParams?.get('bedrooms');
    const bathrooms = searchParams?.get('bathrooms');
    if (bedrooms) attributes['BEDROOMS'] = Number(bedrooms);
    if (bathrooms) attributes['BATHROOMS'] = Number(bathrooms);

    return {
      priceRange: {
        min: minPrice ? Number(minPrice) : DEFAULT_FILTERS.priceRange.min,
        max: maxPrice ? Number(maxPrice) : DEFAULT_FILTERS.priceRange.max,
      },
      rentalPeriod: rentalPeriod || DEFAULT_FILTERS.rentalPeriod,
      attributes,
    };
  });

  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [hoveredPropertyIds, setHoveredPropertyIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState(
    searchParams?.get('search_text') || searchParams?.get('location') || ''
  );
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<PropertySearchRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>(searchParams?.get('sortBy') || 'NEWEST');
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: session } = useAuthSession();
  const queryClient = useQueryClient();
  const pageSize = 12;

  const { data: searchResponse, isLoading } = useQuery({
    ...propertyQueries.search(
      {
        ...(mapBounds || {}),
        search_text: searchValue || undefined,
        listing_type: initialListingType,
        property_category: searchParams?.get('propertyCategory') || undefined,
        property_type: propertyType || undefined,
        min_price: (filters.priceRange.min > 0) ? filters.priceRange.min : undefined,
        max_price: (filters.priceRange.max < 20000000000) ? filters.priceRange.max : undefined,
        bedrooms: (filters.attributes.BEDROOMS as number) || undefined,
        bathrooms: (filters.attributes.BATHROOMS as number) || undefined,
        area: (filters.attributes.AREA as number) || undefined,
        rental_period: filters.rentalPeriod !== 'any' ? filters.rentalPeriod : undefined,
        sort_by: sortBy === 'PRICE_ASC' || sortBy === 'PRICE_DESC' ? 'price' : sortBy === 'NEWEST' ? 'created_at' : 'priority',
        sort_direction: sortBy === 'PRICE_ASC' ? 'asc' : 'desc',
        page: currentPage,
        size: pageSize,
      } as PropertySearchRequest
    ),
    placeholderData: keepPreviousData, // Keep previous data while fetching new page for better UX
  });

  const properties = searchResponse?.payload.data.content || [];
  const totalPages = searchResponse?.payload.data.total_pages || 0;
  const totalElements = searchResponse?.payload.data.total_elements || 0;

  // Group properties by coordinates to handle duplicates
  const groupedProperties = properties.reduce<Record<string, PropertyListingDto[]>>(
    (acc, property) => {
      const lat = property.coordinates?.latitude ?? 0;
      const lng = property.coordinates?.longitude ?? 0;
      const key = `${lat},${lng}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(property);
      return acc;
    },
    {}
  );

  const propertyLocations: PropertyLocation[] = Object.values(groupedProperties).map((group: PropertyListingDto[]) => {
    const firstProperty = group[0];
    const propertyIds = group.map((p) => p.listing_id);

    // If there are multiple properties at the same location, calculate price range
    let label: string | undefined;
    if (group.length > 1) {
      const prices = group.map((p) => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice !== maxPrice) {
        label = `${formatVND(minPrice)} - ${formatVND(maxPrice)}`;
      }
    }

    return {
      id: firstProperty.listing_id,
      ids: propertyIds,
      lat: firstProperty.coordinates?.latitude ?? 0,
      lng: firstProperty.coordinates?.longitude ?? 0,
      price: firstProperty.price,
      label,
      isBoosted: group.some((p) => p.is_boosted),
    };
  });

  const handlePropertyClick = (ids: string[]) => {
    setSelectedPropertyIds(ids);
    // Scroll to the first property in the list
    if (ids.length > 0) {
      const element = document.getElementById(`property-${ids[0]}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleApplyFilters = (newFilters: PropertyFilterValues, newPropertyType?: string) => {
    setFilters(newFilters);
    if (newPropertyType !== propertyType) {
      const params = new URLSearchParams(searchParams?.toString());
      if (newPropertyType) {
        params.set('propertyType', newPropertyType);
      } else {
        params.delete('propertyType');
      }
      router.push(`?${params.toString()}`);
    }
    setCurrentPage(1);
  };

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of listings
    document.getElementById('property-listings-top')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    // Use refs to current state via setState callback to avoid stale closures
    let currentFavorite = false;
    setFavoriteOverrides((prev) => {
      const properties = searchResponse?.payload.data.content || [];
      currentFavorite =
        prev[id] ?? properties.find((p: PropertyListingDto) => p.listing_id === id)?.is_favorite ?? false;
      return { ...prev, [id]: !currentFavorite };
    });
    try {
      await bookmarkApi.toggleBookmark(id);
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch {
      // revert optimistic update on failure
      setFavoriteOverrides((prev) => ({ ...prev, [id]: currentFavorite }));
    }
  }, [session, searchResponse, queryClient]);

  const handleHoverProperty = useCallback((ids: string[]) => {
    setHoveredPropertyIds(ids);
  }, []);

  const handleSelectProperty = useCallback((ids: string[]) => {
    setSelectedPropertyIds(ids);
  }, []);

  const currentSortLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Mới nhất';
  const isPriceActive = filters.priceRange.min > 0 || filters.priceRange.max < 20000000000;

  return (
    <div className='flex h-full w-full'>
      {/* Left Side - Map */}
      <div className='relative hidden lg:block lg:w-[40%] h-full'>
        <PropertyMap
          properties={propertyLocations}
          selectedPropertyIds={selectedPropertyIds}
          hoveredPropertyIds={hoveredPropertyIds}
          onPropertyClick={handlePropertyClick}
          defaultCenter={HCM_CITY_CENTER}
          onBoundsChange={(bounds) => {
            setMapBounds(
              (prev) =>
                ({
                  ...prev,
                  north_lat: bounds.north,
                  south_lat: bounds.south,
                  east_lng: bounds.east,
                  west_lng: bounds.west,
                }) as PropertySearchRequest
            );
          }}
        />

      </div>

      {/* Right Side - Property Listings */}
      <div className='w-full lg:w-[60%] bg-primary/5 h-full flex flex-col'>
        {/* Fixed Header Section - không scroll */}
        <div className='flex-shrink-0 px-4 pt-6 pb-4'>
          <div className='mx-auto max-w-6xl'>
            {/* Title and Property Count - Outside wrapper */}
            <div className='mb-4'>
              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-3'>
                  <h1 className='text-xl font-bold tracking-tight text-foreground sm:text-2xl'>
                    {initialListingType === 'SALE' ? t('searchTitleSale') : t('searchTitleRent')}
                  </h1>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-primary' />
                  <p className='text-sm font-medium text-muted-foreground'>
                    <span className='font-bold text-primary'>{totalElements}</span> {
                      initialListingType === 'SALE'
                        ? t('propertiesAvailableSale')
                        : t('propertiesAvailableRent')
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Filters Section - White Card Wrapper (Landing Page Style) */}
            <div className='rounded-xl bg-white shadow-lg sm:p-3 sm:pb-1'>
              {/* ROW 1 — Location + Price + Sort + Back Button */}
              <div className='flex items-center gap-3 mb-3'>
                {/* Location Input */}
                <div className='relative flex-1 min-w-0 rounded-full bg-slate-100'>
                  <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <input
                    type='text'
                    placeholder='Tìm kiếm với địa chỉ cụ thể'
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setCurrentPage(1);
                      }
                    }}
                    className='h-10 w-full bg-transparent pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none rounded-full'
                    maxLength={100}
                  />
                  {searchValue && (
                    <button
                      type='button'
                      onClick={() => setSearchValue('')}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  )}
                </div>

                {/* Price Filter Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type='button'
                      className={cn(
                        'flex h-9 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0',
                        isPriceActive
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-primary/20 bg-white text-foreground hover:border-primary/50'
                      )}
                    >
                      <span>
                        {isPriceActive
                          ? `${formatVND(filters.priceRange.min)} - ${formatVND(filters.priceRange.max)}`
                          : t('priceRange')}
                      </span>
                      <ChevronDown className={cn('h-4 w-4 transition-transform', isPriceActive ? 'text-primary' : 'text-muted-foreground')} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className='w-[420px] p-6' align='start'>
                    <div className='space-y-6'>
                      <h4 className='text-lg font-bold text-foreground'>Khoảng giá</h4>
                      <div className='flex flex-col gap-5'>
                        <div className='space-y-5'>
                          <div className='space-y-2'>
                            <Label className='text-sm font-semibold text-muted-foreground'>Giá tối thiểu (VNĐ)</Label>
                            <VndAmountInput
                              value={filters.priceRange.min}
                              onChange={(val) => setFilters({ ...filters, priceRange: { ...filters.priceRange, min: Math.max(0, Math.trunc(val || 0)) } })}
                              placeholder='0'
                              hidePreview
                              inputClassName='h-12 text-lg font-medium'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-sm font-semibold text-muted-foreground'>Giá tối đa (VNĐ)</Label>
                            <VndAmountInput
                              value={filters.priceRange.max}
                              onChange={(val) => setFilters({ ...filters, priceRange: { ...filters.priceRange, max: Math.max(0, Math.trunc(val || 0)) } })}
                              placeholder='Bất kỳ'
                              hidePreview
                              inputClassName='h-12 text-lg font-medium'
                            />
                          </div>
                        </div>
                        <div className='flex justify-end gap-2 border-t border-primary/20 pt-4'>
                          <Button variant='link' size='sm' className='text-sm font-bold text-primary h-auto p-0' onClick={() => setFilters({ ...filters, priceRange: { min: 0, max: 20000000000 } })}>
                            Xóa tất cả
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Sort Filter Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type='button'
                      className={cn(
                        'flex h-9 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0',
                        sortBy !== 'NEWEST'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-primary/20 bg-white text-foreground hover:border-primary/50'
                      )}
                    >
                      <span>{currentSortLabel}</span>
                      <ChevronDown className={cn('h-4 w-4 transition-transform', sortBy !== 'NEWEST' ? 'text-primary' : 'text-muted-foreground')} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className='w-56 p-2' align='start'>
                    <div className='flex flex-col'>
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value);
                            setCurrentPage(1);
                          }}
                          className={cn(
                            'flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            sortBy === opt.value
                              ? 'bg-primary/5 text-primary'
                              : 'text-foreground hover:bg-muted'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Filter Icon - Opens PropertyFiltersModal */}
                <button
                  type='button'
                  onClick={() => setFiltersModalOpen(true)}
                  className='flex h-9 w-9 items-center justify-center rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer shrink-0'
                  title={t('moreFilters')}
                >
                  <Filter className='h-4 w-4' />
                </button>

                {/* Back Button */}
                {onBack && (
                  <button
                    type='button'
                    onClick={onBack}
                    className='flex h-9 w-9 items-center justify-center rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer shrink-0'
                    title='List view'
                  >
                    <List className='h-4 w-4' />
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Scrollable Listings Section */}
        <div className='flex-1 overflow-y-auto px-4 pb-4'>
          <div className='mx-auto max-w-6xl'>
            <SearchListingResults
              properties={properties}
              isLoading={isLoading}
              viewMode={viewMode}
              selectedPropertyIds={selectedPropertyIds}
              favoriteOverrides={favoriteOverrides}
              currentPage={currentPage}
              totalPages={totalPages}
              locale={locale}
              listingType={initialListingType}
              onHoverProperty={handleHoverProperty}
              onSelectProperty={handleSelectProperty}
              onToggleFavorite={handleToggleFavorite}
              onPageChange={handlePageChange}
              onResetFilters={handleResetFilters}
            />
          </div>
        </div>

        {/* Filters Modal */}
        <PropertyFiltersModal
          open={filtersModalOpen}
          onOpenChange={setFiltersModalOpen}
          filters={filters}
          propertyType={propertyType || undefined}
          listingType={initialListingType}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          translations={{
            title: t('moreFiltersTitle'),
            category: t('category'),
            priceRange: t('priceRange'),
            features: t('features'),
            rentalPeriod: {
              label: t('rentalPeriod.label'),
              any: t('rentalPeriod.any'),
              '1-12': t('rentalPeriod.1-12'),
              '13-24': t('rentalPeriod.13-24'),
              '24+': t('rentalPeriod.24+'),
            },
            reset: t('reset'),
            apply: t('apply'),
          }}
        />
      </div>
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default PropertyMapBasedSearchPage;
