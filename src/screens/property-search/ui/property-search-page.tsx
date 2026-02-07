'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PropertyMap, type PropertyLocation } from '@/shared/ui/property-map';
import { PropertySearchHeader } from '@/shared/ui/property-search-header';
import { PropertyFilters, type ViewMode } from '@/shared/ui/property-filters';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { mockProperties } from '@/entities/property';

// Convert mock properties to map locations
function convertToMapLocations(properties: typeof mockProperties): PropertyLocation[] {
  return properties.map((property) => ({
    id: property.id,
    // Mock coordinates - in real app, these would come from property data
    lat: 21.0285 + (Math.random() - 0.5) * 0.1,
    lng: 105.8542 + (Math.random() - 0.5) * 0.1,
    price: property.price,
    currency: '$',
  }));
}

export function PropertySearchPage() {
  const t = useTranslations('PropertySearch');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const propertyLocations = convertToMapLocations(mockProperties);

  const handlePropertyClick = (id: string) => {
    setSelectedPropertyId(id);
    // Scroll to property card in the list
    const element = document.getElementById(`property-${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
            propertyCount={mockProperties.length}
            searchPlaceholder={t('searchPlaceholder')}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onMoreFilters={() => console.log('Open filters modal')}
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
            {mockProperties.map((property) => (
              <div
                key={property.id}
                id={`property-${property.id}`}
                onMouseEnter={() => setHoveredPropertyId(property.id)}
                onMouseLeave={() => setHoveredPropertyId(undefined)}
                onClick={() => setSelectedPropertyId(property.id)}
              >
                <RealVistaListingCard
                  {...property}
                  onToggleFavorite={(id: string) => console.log('Toggle favorite:', id)}
                  onClick={(id: string) => console.log('Property clicked:', id)}
                  className={selectedPropertyId === property.id ? 'ring-2 ring-main-primary' : ''}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertySearchPage;
