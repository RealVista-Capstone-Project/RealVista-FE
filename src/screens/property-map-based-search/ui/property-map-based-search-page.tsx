'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { bookmarkApi } from '@/entities/bookmark';
import { ChevronLeft, Search } from 'lucide-react';
import { RealVistaButton } from '@/shared/ui/realvista-button/realvista-button';
import { Button } from '@/shared/ui/button/button';
import { useAuthSession } from '@/features/auth/model';
import { LoginRequiredModal } from '@/shared/ui/login-required-modal/login-required-modal';
import { PropertyMap, type PropertyLocation } from '@/shared/ui/property-map';
import { PropertySearchHeader } from '@/shared/ui/property-search-header';
import { PropertyFilters, type ViewMode } from '@/shared/ui/property-filters';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  RealVistaListingCard,
  type ListingAttribute,
} from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { Pagination } from '@/shared/ui/realvista-pagination';
import {
  propertyQueries,
  type PropertyListingDto,
  type PropertySearchRequest,
} from '@/entities/property';
import { formatVND } from '@/shared/lib/utils/format-currency';
import {
  PropertyFiltersModal,
  type PropertyFilters as PropertyFilterValues,
  type RentalPeriod,
} from '@/shared/ui/property-filters-modal';
import { HCM_CITY_CENTER } from '@/shared/constants';
import { FLAT_PROPERTY_TYPES } from '@/shared/config/property-types';

// Default filter values
const DEFAULT_FILTERS: PropertyFilterValues = {
  priceRange: { min: 0, max: 20000000000 },
  rentalPeriod: 'any',
  attributes: {},
};

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
  const pageSize = 10;

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

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of listings
    document.getElementById('property-listings-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleFavorite = async (id: string) => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    const currentFavorite =
      favoriteOverrides[id] ?? properties.find((p: PropertyListingDto) => p.listing_id === id)?.is_favorite ?? false;
    setFavoriteOverrides((prev) => ({ ...prev, [id]: !currentFavorite }));
    try {
      await bookmarkApi.toggleBookmark(id);
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch {
      // revert optimistic update on failure
      setFavoriteOverrides((prev) => ({ ...prev, [id]: currentFavorite }));
    }
  };

  return (
    <div className='flex h-full w-full'>
      {/* Left Side - Map */}
      <div className='relative hidden lg:block lg:w-1/2 h-full'>
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
      <div className='w-full lg:w-1/2 overflow-y-auto bg-primary/5 h-full'>
        <div className='mx-auto max-w-4xl p-6'>
          <PropertySearchHeader
            title={initialListingType === 'SALE' ? t('searchTitleSale') : t('searchTitleRent')}
            propertyCount={totalElements}
            propertyCountLabel={
              initialListingType === 'SALE'
                ? t('propertiesAvailableSale')
                : t('propertiesAvailableRent')
            }
            searchPlaceholder='Tìm theo phố, phường, quận hoặc tên dự án...'
            searchValue={searchValue}
            onSearchChange={(val) => {
              setSearchValue(val);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCurrentPage(1);
              }
            }}
            onMoreFilters={() => setFiltersModalOpen(true)}
            moreFiltersLabel={t('moreFilters')}
            action={
              onBack && (
                <RealVistaButton
                  type='button'
                  onClick={onBack}
                  variant='secondary'
                  className='w-full justify-between gap-3 border-[1.5px] bg-white px-4 py-3 h-auto text-base font-medium text-secondary opacity-70 hover:bg-white hover:opacity-100 sm:w-auto cursor-pointer'
                >
                  <span>Quay lại</span>
                  <div className='relative flex h-5 w-5 items-center justify-center'>
                    {/* Background circle */}
                    <div className='absolute inset-0 rounded-full bg-primary/5'></div>
                    {/* Icon */}
                    <ChevronLeft className='relative h-3 w-3 text-primary' strokeWidth={2.5} />
                  </div>
                </RealVistaButton>
              )
            }
          />

          {/* Filters Container */}
          <div className='mt-6 sticky top-0 z-10 bg-primary/5/80 backdrop-blur-md py-2 px-1'>
            <PropertyFilters
              priceRange={{
                min: filters.priceRange.min,
                max: filters.priceRange.max,
              }}
              onPriceChange={(min, max) => {
                setFilters({
                  ...filters,
                  priceRange: { min, max },
                });
                setCurrentPage(1);
              }}
              priceLabel={
                filters.priceRange.min > 0 || filters.priceRange.max < 20000000000
                  ? `${formatVND(filters.priceRange.min)} - ${formatVND(filters.priceRange.max)}`
                  : t('priceRange')
              }
              typeLabel={
                propertyType
                  ? FLAT_PROPERTY_TYPES.find((t) => t.code === propertyType)?.label || propertyType
                  : 'Loại bất động sản'
              }
              sortBy={sortBy}
              onSortChange={(val) => {
                setSortBy(val);
                setCurrentPage(1);
              }}
              onMoreFilters={() => setFiltersModalOpen(true)}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Property Grid/List */}
          <div id='property-listings-top' />
          <div
            className={`mt-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'flex flex-col gap-4'}`}
          >
            {isLoading ? (
              <div className='col-span-full grid grid-cols-1 md:grid-cols-2 gap-6'>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className='flex flex-col gap-3 rounded-2xl border border-primary/20 bg-white p-3'>
                    <Skeleton className='aspect-[4/3] w-full rounded-xl' />
                    <div className='space-y-2 px-1'>
                      <Skeleton className='h-6 w-3/4' />
                      <Skeleton className='h-4 w-1/2' />
                      <div className='flex gap-2 pt-2'>
                        <Skeleton className='h-8 w-20 rounded-full' />
                        <Skeleton className='h-8 w-20 rounded-full' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className='col-span-full flex flex-col items-center justify-center py-20 text-center opacity-60'>
                <div className='mb-4 rounded-full bg-primary/5 p-6'>
                  <Search className='h-10 w-10 text-primary' />
                </div>
                <h3 className='text-xl font-bold text-foreground'>Không tìm thấy kết quả</h3>
                <p className='text-muted-foreground'>Thử thay đổi bộ lọc hoặc vùng tìm kiếm của bạn</p>
                <Button variant='link' onClick={handleResetFilters} className='mt-2 text-primary font-bold'>Xóa tất cả bộ lọc</Button>
              </div>
            ) : (
              properties.map((property: PropertyListingDto) => (
                <div
                  key={property.listing_id}
                  id={`property-${property.listing_id}`}
                  onMouseEnter={() => setHoveredPropertyIds([property.listing_id])}
                  onMouseLeave={() => setHoveredPropertyIds([])}
                  onClick={() => setSelectedPropertyIds([property.listing_id])}
                >
                  <RealVistaListingCard
                    id={property.listing_id}
                    title={property.name}
                    address={property.full_address}
                    price={property.price}
                    image={property.thumbnail ?? ''}
                    attributes={property.attributes as ListingAttribute[]}
                    areaUnit='m²'
                    isFavorite={favoriteOverrides[property.listing_id] ?? property.is_favorite}
                    boostTags={property.is_boosted ? property.boost_packages : undefined}
                    userType={property.user_type as 'AGENT' | 'OWNER'}
                    variant={viewMode}
                    listingType={initialListingType}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={() =>
                      router.push(`/${locale}/listing/${property.slug || property.listing_id}`)
                    }
                    className={
                      selectedPropertyIds.includes(property.listing_id)
                        ? 'ring-2 ring-primary'
                        : ''
                    }
                  />
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-8 pb-4'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
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
