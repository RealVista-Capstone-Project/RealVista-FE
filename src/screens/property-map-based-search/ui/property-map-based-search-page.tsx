'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { RealVistaButton } from '@/shared/ui/realvista-button/realvista-button';
import { PropertyMap, type PropertyLocation } from '@/shared/ui/property-map';
import { PropertySearchHeader } from '@/shared/ui/property-search-header';
import { PropertyFilters, type ViewMode } from '@/shared/ui/property-filters';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
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
} from '@/shared/ui/property-filters-modal';
import { HCM_CITY_CENTER } from '@/shared/constants';

// Default filter values
const DEFAULT_FILTERS: PropertyFilterValues = {
  category: [],
  priceRange: { min: 1000, max: 1234567 },
  bedrooms: 0,
  bathrooms: 0,
  rentalPeriod: 'any',
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
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [hoveredPropertyIds, setHoveredPropertyIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [filters, setFilters] = useState<PropertyFilterValues>(DEFAULT_FILTERS);
  const [mapBounds, setMapBounds] = useState<PropertySearchRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: searchResponse, isLoading } = useQuery(
    propertyQueries.search(
      mapBounds
        ? {
            ...mapBounds,
            search_text: searchValue,
            listing_type: initialListingType,
            category: filters.category.length > 0 ? filters.category.join(',') : undefined,
            min_price: filters.priceRange.min,
            max_price: filters.priceRange.max,
            bedrooms: filters.bedrooms > 0 ? filters.bedrooms : undefined,
            bathrooms: filters.bathrooms > 0 ? filters.bathrooms : undefined,
            rental_period: filters.rentalPeriod,
            page: currentPage,
            size: pageSize,
          }
        : ({} as PropertySearchRequest) // Skip query until map bounds are ready
    )
  );

  const properties = searchResponse?.payload.data.content || [];
  const totalPages = searchResponse?.payload.data.total_pages || 0;
  const totalElements = searchResponse?.payload.data.total_elements || 0;

  // Group properties by coordinates to handle duplicates
  const groupedProperties = properties.reduce(
    (acc, property) => {
      const key = `${property.coordinates.latitude},${property.coordinates.longitude}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(property);
      return acc;
    },
    {} as Record<string, PropertyListingDto[]>
  );

  const propertyLocations: PropertyLocation[] = Object.values(groupedProperties).map((group) => {
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
      lat: firstProperty.coordinates.latitude,
      lng: firstProperty.coordinates.longitude,
      price: firstProperty.price,
      currency: '$', // TODO: backend should provide currency or use locale
      label,
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

  const handleApplyFilters = (newFilters: PropertyFilterValues) => {
    setFilters(newFilters);
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

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  return (
    <div className='flex h-screen w-full'>
      {/* Left Side - Map */}
      <div className='hidden lg:block lg:w-1/2'>
        <PropertyMap
          properties={propertyLocations}
          selectedPropertyIds={selectedPropertyIds}
          hoveredPropertyIds={hoveredPropertyIds}
          onPropertyClick={handlePropertyClick}
          defaultCenter={HCM_CITY_CENTER}
          onBoundsChange={(bounds) => {
            setCurrentPage(1);
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
      <div className='w-full lg:w-1/2 overflow-y-auto bg-purple-98'>
        <div className='mx-auto max-w-4xl p-6'>
          <PropertySearchHeader
            title={initialListingType === 'SALE' ? t('searchTitleSale') : t('searchTitleRent')}
            propertyCount={totalElements}
            propertyCountLabel={
              initialListingType === 'SALE'
                ? t('propertiesAvailableSale')
                : t('propertiesAvailableRent')
            }
            searchPlaceholder={t('searchPlaceholder')}
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            onMoreFilters={() => setFiltersModalOpen(true)}
            homeLabel={t('home')}
            searchLabel={t('search')}
            moreFiltersLabel={t('moreFilters')}
            action={
              onBack && (
                <RealVistaButton
                  type='button'
                  onClick={onBack}
                  variant='secondary'
                  className='w-full justify-between gap-3 border-[1.5px] bg-white px-4 py-3 h-auto text-base font-medium text-main-secondary opacity-70 hover:bg-white hover:opacity-100 sm:w-auto cursor-pointer'
                >
                  <span>{t('searchWithSearchBar')}</span>
                  <div className='relative flex h-5 w-5 items-center justify-center'>
                    {/* Background circle */}
                    <div className='absolute inset-0 rounded-full bg-purple-96'></div>
                    {/* Icon */}
                    <MapPin className='relative h-3 w-3 text-main-primary' strokeWidth={2.5} />
                  </div>
                </RealVistaButton>
              )
            }
          />

          {/* Filters */}
          {/* TODO: Please implement filters */}
          <div className='mt-6'>
            <PropertyFilters
              priceFilter={{
                label: t('anyPrice'),
                value: 'any',
                onClick: () => console.log('Price filter'),
              }}
              bedsFilter={{
                label: `2-4 ${t('beds')}`,
                value: '2-4',
                onClick: () => console.log('Beds filter'),
              }}
              typeFilter={{
                label: t('allTypes'),
                value: 'all',
                onClick: () => console.log('Type filter'),
              }}
              sortFilter={{
                label: t('newest'),
                value: 'newest',
                onClick: () => console.log('Sort filter'),
              }}
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
              <div className='col-span-full flex justify-center py-10'>
                {/* TODO: Add proper loading skeleton */}
                <span className='loading loading-spinner loading-lg'>Loading...</span>
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
                    address={property.street_address}
                    price={property.price}
                    image={property.thumbnail_url}
                    beds={property.bedrooms || 0}
                    bathrooms={property.bathrooms || 0}
                    area={property.size_m2}
                    areaUnit='m²'
                    isFavorite={property.is_favorite}
                    variant={viewMode}
                    listingType={initialListingType}
                    onToggleFavorite={(id: string) => console.log('Toggle favorite:', id)}
                    onClick={(id: string) => handlePropertyClick([id])}
                    className={
                      selectedPropertyIds.includes(property.listing_id)
                        ? 'ring-2 ring-main-primary'
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
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          translations={{
            title: t('moreFiltersTitle'),
            category: t('category'),
            categories: {
              residential: t('categories.residential'),
              commercial: t('categories.commercial'),
              industrial: t('categories.industrial'),
              land: t('categories.land'),
            },
            priceRange: t('priceRange'),
            features: t('features'),
            bedroom: t('bedroom'),
            bathroom: t('bathroom'),
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
    </div>
  );
}

export default PropertyMapBasedSearchPage;
