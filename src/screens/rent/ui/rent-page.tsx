'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { SearchMode } from '@/shared/types/searchMode';
import { ListingCard } from '@/shared/ui/listing-card/listing-card';
import { PropertyListingSearchBar } from '@/shared/ui/property-listing-search-bar/property-listing-search-bar';
import { Pagination } from '@/shared/ui/pagination';

// Mock data for property listings
const mockProperties = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    title: 'Palm Harbor',
    address: '2699 Green Valley, Highland Lake, FL',
    price: 2095,
    beds: 3,
    bathrooms: 2,
    area: 5,
    areaUnit: 'x7 m²',
    isPopular: true,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    title: 'Beverly Springfield',
    address: '2821 Lake Sevilla, Palm Harbor, TX',
    price: 2700,
    beds: 4,
    bathrooms: 2,
    area: 6,
    areaUnit: 'x7.5 m²',
    isPopular: true,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    title: 'Faulkner Ave',
    address: '909 Woodland St, Michigan, IN',
    price: 4550,
    beds: 4,
    bathrooms: 3,
    area: 8,
    areaUnit: 'x10 m²',
    isPopular: true,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    title: 'St. Crystal',
    address: '210 US Highway, Highland Lake, FL',
    price: 2400,
    beds: 4,
    bathrooms: 2,
    area: 6,
    areaUnit: 'x8 m²',
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    title: 'Cove Red',
    address: '243 Curlew Road, Palm Harbor, TX',
    price: 1500,
    beds: 2,
    bathrooms: 1,
    area: 5,
    areaUnit: 'x7.5 m²',
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800',
    title: 'The Old Steele',
    address: '103 Lake Shores, Michigan, IN',
    price: 1600,
    beds: 3,
    bathrooms: 1,
    area: 5,
    areaUnit: 'x7 m²',
  },
];

export function RentPage() {
  const t = useTranslations('Rent');
  const [searchMode, setSearchMode] = useState<SearchMode>('searchBar');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Show 3 properties per page to demonstrate pagination

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

  return (
    <div className='min-h-screen bg-purple-98'>
      {/* Hero Section with Search */}
      <section className='px-4 pb-8 pt-16 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {/* Header with Title and Search Option Toggle */}
          <div className='mb-8 flex items-start justify-between'>
            <h1 className='text-[40px] font-bold leading-[1.4] tracking-[-0.4px] text-main-black'>
              {t('searchTitle')}
            </h1>

            {/* Search Option Toggle */}
            <div className='relative'>
              <button
                type='button'
                onClick={() => setSearchMode(searchMode === 'map' ? 'searchBar' : 'map')}
                className='flex items-center justify-between gap-3 rounded-lg border-[1.5px] border-purple-92 bg-white px-4 py-3 text-base font-medium text-main-secondary opacity-70 transition-all hover:opacity-100'
              >
                <span>{searchMode === 'map' ? t('searchWithMap') : t('searchWithSearchBar')}</span>
                <div className='relative flex h-5 w-5 items-center justify-center'>
                  {/* Background circle */}
                  <div className='absolute inset-0 rounded-full bg-purple-96'></div>
                  {/* Icon */}
                  <MapPin className='relative h-3 w-3 text-main-primary' strokeWidth={2.5} />
                </div>
              </button>
            </div>
          </div>

          {/* Property Search Bar - Reusable Component */}
          <PropertyListingSearchBar
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
      <section className='px-4 pb-12 pt-8 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {/* Property Grid */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {currentProperties.map((property) => (
              <ListingCard
                key={property.id}
                {...property}
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

export default RentPage;
