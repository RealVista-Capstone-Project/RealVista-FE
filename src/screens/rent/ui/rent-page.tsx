'use client';

import { useTranslations } from 'next-intl';

export function RentPage() {
  const t = useTranslations('Rent');

  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section with Search */}
      <section className='bg-gradient-to-b from-purple-50 to-white px-8 py-16'>
        <div className='mx-auto max-w-7xl'>
          <h1 className='mb-8 text-[40px] font-bold leading-[1.4] tracking-[-0.4px] text-main-black'>
            {t('searchTitle')}
          </h1>

          {/* Search Bar */}
          <div className='rounded-xl bg-white p-6 shadow-lg'>
            <div className='flex gap-4'>
              <input
                type='text'
                placeholder={t('searchPlaceholder')}
                className='flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-main-primary focus:outline-none focus:ring-2 focus:ring-main-primary/20'
              />
              <button
                type='button'
                className='rounded-lg bg-main-primary px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-main-primary/90'
              >
                {t('searchButton')}
              </button>
            </div>

            {/* Quick Filters */}
            <div className='mt-4 flex flex-wrap gap-4'>
              <select className='rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-main-primary focus:outline-none focus:ring-2 focus:ring-main-primary/20'>
                <option>{t('propertyType')}</option>
                <option>Căn hộ</option>
                <option>Nhà riêng</option>
                <option>Studio</option>
                <option>Penthouse</option>
              </select>

              <select className='rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-main-primary focus:outline-none focus:ring-2 focus:ring-main-primary/20'>
                <option>{t('bedrooms')}</option>
                <option>1+</option>
                <option>2+</option>
                <option>3+</option>
                <option>4+</option>
              </select>

              <select className='rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-main-primary focus:outline-none focus:ring-2 focus:ring-main-primary/20'>
                <option>{t('bathrooms')}</option>
                <option>1+</option>
                <option>2+</option>
                <option>3+</option>
              </select>

              <select className='rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-main-primary focus:outline-none focus:ring-2 focus:ring-main-primary/20'>
                <option>{t('priceRange')}</option>
                <option>Dưới 5 triệu</option>
                <option>5 - 10 triệu</option>
                <option>10 - 20 triệu</option>
                <option>20 - 30 triệu</option>
                <option>Trên 30 triệu</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className='px-8 py-12'>
        <div className='mx-auto max-w-7xl'>
          <div className='mb-6 flex items-center justify-between'>
            <p className='text-lg text-gray-700'>
              <span className='font-semibold text-main-black'>1,234</span> {t('results')}
            </p>
            <select className='rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-main-primary focus:outline-none focus:ring-2 focus:ring-main-primary/20'>
              <option>{t('sortBy')}: Mới nhất</option>
              <option>Giá thấp đến cao</option>
              <option>Giá cao đến thấp</option>
              <option>Diện tích lớn nhất</option>
            </select>
          </div>

          {/* Property Grid */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {/* Placeholder cards - These would be populated with real data */}
            {[1, 2, 3, 4, 5, 6].map((item) => (
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
