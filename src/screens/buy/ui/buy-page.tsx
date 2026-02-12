'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { RealVistaPropertyListingSearchBar } from '@/shared/ui/realvista-property-listing-search-bar/realvista-property-listing-search-bar';
import { Pagination } from '@/shared/ui/realvista-pagination';
import { mockProperties } from '@/entities/property';
import { Button } from '@/shared/ui/button/button';
import { PropertyMapBasedSearchPage } from '@/screens/property-map-based-search/ui/property-map-based-search-page';

export function BuyPage() {
  const t = useTranslations('Buy');
  const [isMapView, setIsMapView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Calculate pagination
  const totalPages = Math.ceil(mockProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = mockProperties.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isMapView) {
    return (
      <div className='h-screen w-full bg-white'>
        <PropertyMapBasedSearchPage initialListingType='SALE' onBack={() => setIsMapView(false)} />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-purple-98'>
      {/* Hero Section with Search */}
      <section className='px-6 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-16 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {/* Header with Title and Search Option Toggle */}
          <div className='mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center sm:gap-6'>
            <h1 className='text-2xl font-bold leading-[1.2] tracking-[-0.4px] text-main-black sm:text-3xl lg:text-[40px] sm:leading-[1.4]'>
              {t('searchTitle')}
            </h1>

            {/* Search Option Toggle */}
            <div className='w-full sm:w-auto'>
              <Button
                type='button'
                onClick={() => setIsMapView(!isMapView)}
                className='flex w-full items-center justify-between gap-3 rounded-lg border-[1.5px] border-purple-92 bg-white px-4 py-3 text-base font-medium text-main-secondary opacity-70 transition-all hover:opacity-100 sm:w-auto cursor-pointer'
                variant='outline'
              >
                <span>{isMapView ? t('searchWithSearchBar') : t('searchWithMap')}</span>
                <div className='relative flex h-5 w-5 items-center justify-center'>
                  {/* Background circle */}
                  <div className='absolute inset-0 rounded-full bg-purple-96'></div>
                  {/* Icon */}
                  <MapPin className='relative h-3 w-3 text-main-primary' strokeWidth={2.5} />
                </div>
              </Button>
            </div>
          </div>

          {/* Property Search Bar - Reusable Component */}
          <RealVistaPropertyListingSearchBar
            locationLabel={t('location')}
            location={t('locationDefault')}
            whenLabel={t('when')}
            whenPlaceholder={t('selectMoveInDate')}
            priceLabel={t('price')}
            priceValue={t('priceDefault')}
            propertyTypeLabel={t('propertyType')}
            propertyTypeValue={t('propertyTypeDefault')}
            searchButtonLabel={t('searchButton')}
            onSearch={() => console.log('Search clicked')}
          />
        </div>
      </section>

      {/* Results Section */}
      <section className='px-6 pb-12 pt-8 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {/* Property Grid */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {currentProperties.map((property) => (
              <RealVistaListingCard
                key={property.id}
                {...property}
                listingType='SALE'
                onToggleFavorite={(id: string) => console.log('Toggle favorite:', id)}
                onClick={(id: string) => console.log('Property clicked:', id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-12'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default BuyPage;
