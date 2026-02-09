'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { PropertyMap, type PropertyLocation } from '@/shared/ui/property-map';
import { PropertySearchHeader } from '@/shared/ui/property-search-header';
import { PropertyFilters, type ViewMode } from '@/shared/ui/property-filters';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { propertyQueries, type PropertyListingDto } from '@/entities/property';
import {
  PropertyFiltersModal,
  type PropertyFilters as PropertyFilterValues,
} from '@/shared/ui/property-filters-modal';

// Default filter values
const DEFAULT_FILTERS: PropertyFilterValues = {
  category: 'houses',
  priceRange: { min: 1000, max: 1234567 },
  bedrooms: 4,
  bathrooms: 2,
  rentalPeriod: 'any',
};

export function PropertySearchPage() {
  const t = useTranslations('PropertySearch');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [filters, setFilters] = useState<PropertyFilterValues>(DEFAULT_FILTERS);

  const { data: searchResponse, isLoading } = useQuery(
    propertyQueries.search({
      search_text: searchValue,
      category: filters.category,
      min_price: filters.priceRange.min,
      max_price: filters.priceRange.max,
      bedrooms: filters.bedrooms,
      bathrooms: filters.bathrooms,
      rental_period: filters.rentalPeriod,
      page: 1, // TODO: Implement pagination state
      size: 50,
    })
  );

  const properties = searchResponse?.payload.data.content || [];
  const propertyLocations: PropertyLocation[] = properties.map((p: PropertyListingDto) => ({
    id: p.listing_id,
    lat: p.coordinates.latitude,
    lng: p.coordinates.longitude,
    price: p.price,
    currency: '$', // TODO: backend should provide currency or use locale
  }));

  const handlePropertyClick = (id: string) => {
    setSelectedPropertyId(id);
    // Scroll to property card in the list
    const element = document.getElementById(`property-${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleApplyFilters = (newFilters: PropertyFilterValues) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className='flex h-screen w-full'>
      {/* Left Side - Map */}
      <div className='hidden lg:block lg:w-1/2'>
        <PropertyMap
          properties={propertyLocations}
          selectedPropertyId={selectedPropertyId}
          hoveredPropertyId={hoveredPropertyId}
          onPropertyClick={handlePropertyClick}
        />
      </div>

      {/* Right Side - Property Listings */}
      <div className='w-full lg:w-1/2 overflow-y-auto bg-purple-98'>
        <div className='mx-auto max-w-4xl p-6'>
          {/* Search Header */}
          <PropertySearchHeader
            title={t('searchTitle')}
            propertyCount={searchResponse?.payload.data.total_elements || 0}
            searchPlaceholder={t('searchPlaceholder')}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onMoreFilters={() => setFiltersModalOpen(true)}
            homeLabel={t('home')}
            searchLabel={t('search')}
            moreFiltersLabel={t('moreFilters')}
          />

          {/* Filters */}
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
                  onMouseEnter={() => setHoveredPropertyId(property.listing_id)}
                  onMouseLeave={() => setHoveredPropertyId(undefined)}
                  onClick={() => setSelectedPropertyId(property.listing_id)}
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
                    onToggleFavorite={(id: string) => console.log('Toggle favorite:', id)}
                    onClick={(id: string) => console.log('Property clicked:', id)}
                    className={
                      selectedPropertyId === property.listing_id ? 'ring-2 ring-main-primary' : ''
                    }
                  />
                </div>
              ))
            )}
          </div>
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
              houses: t('categories.houses'),
              rooms: t('categories.rooms'),
              apartment: t('categories.apartment'),
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

export default PropertySearchPage;
