'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { SearchMode } from '@/shared/types/searchMode';
import { PropertySearchBar } from '@/shared/ui';

export function RentPage() {
  const t = useTranslations('Rent');
  const [searchMode, setSearchMode] = useState<SearchMode>('searchBar');

  return (
    <div className='min-h-screen'>
      {/* Hero Section with Search */}
      <section className='bg-gradient-to-b from-purple-50 to-white px-4 py-16 sm:px-6 lg:px-8'>
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
          <PropertySearchBar
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
      <section className='px-4 py-12 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>

          {/* Property Grid */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {/* Placeholder cards - These would be populated with real data */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
              <div
                key={item}
                className='overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md'
              >
                <div className='aspect-video bg-gray-200'></div>
                <div className='p-4'>
                  <h3 className='mb-2 text-lg font-semibold text-main-black'>
                    Căn hộ hiện đại {item}
                  </h3>
                  <p className='mb-2 text-sm text-gray-600'>Quận 1, TP. Hồ Chí Minh</p>
                  <div className='mb-3 flex items-center gap-4 text-sm text-gray-600'>
                    <span>2 phòng ngủ</span>
                    <span>•</span>
                    <span>2 phòng tắm</span>
                    <span>•</span>
                    <span>80m²</span>
                  </div>
                  <p className='text-xl font-bold text-main-primary'>
                    {(10 + item * 2).toLocaleString('vi-VN')} triệu {t('perMonth')}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}

export default RentPage;
