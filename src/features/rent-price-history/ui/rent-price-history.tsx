import { useTranslations } from 'next-intl';
import type { Property } from '@/entities/property';

export interface RentPriceHistoryProps {
  property: Property;
}

export interface PriceHistoryEntry {
  date: string;
  price: number;
  event: string;
  source: string;
}

const defaultPriceHistory: PriceHistoryEntry[] = [
  { date: '09/02/2019', price: 1800, event: 'listedForSale', source: 'publicRecords' },
  { date: '25/11/2019', price: 1900, event: 'blackFriday', source: 'publicRecords' },
  { date: '03/04/2020', price: 2000, event: 'rented', source: 'publicRecords' },
  { date: '10/10/2021', price: 2600, event: 'priceChange', source: 'estatery' },
  { date: '28/12/2021', price: 2700, event: 'listedForSale', source: 'estatery' },
];

/**
 * RentPriceHistory component displays property price history
 * with responsive table (desktop) and card (mobile) layouts
 */
export function RentPriceHistory({ property }: RentPriceHistoryProps) {
  const t = useTranslations('RentPriceHistory');
  const priceHistory = defaultPriceHistory;

  return (
    <div className='flex flex-col gap-8'>
      <h2 className='text-main-black text-[24px] font-bold leading-[1.5] tracking-[-0.24px]'>
        {t('title', { title: property.title })}
      </h2>
      <div className='bg-purple-98/84 rounded-lg p-4'>
        {/* Desktop Table */}
        <div className='hidden md:block'>
          {/* Table Header */}
          <div className='grid grid-cols-[220px_1fr_1fr_1fr] gap-4 mb-4'>
            <p className='text-main-black text-[16px] font-bold leading-[1.5]'>{t('date')}</p>
            <p className='text-main-black text-[16px] font-bold leading-[1.5]'>{t('price')}</p>
            <p className='text-main-black text-[16px] font-bold leading-[1.5]'>{t('event')}</p>
            <p className='text-main-black text-[16px] font-bold leading-[1.5]'>{t('source')}</p>
          </div>
          {/* Table Body */}
          {priceHistory.map((item, index) => (
            <div
              key={index}
              className='grid grid-cols-[220px_1fr_1fr_1fr] gap-4 py-4 border-t border-purple-92'
            >
              <p className='text-grey-500 text-[16px] font-medium leading-[1.5]'>{item.date}</p>
              <p className='text-main-black text-[16px] font-medium leading-[1.5]'>
                ${item.price.toLocaleString('en-US')}
                {t('perMonth')}
              </p>
              <p className='text-main-black text-[16px] font-medium leading-[1.5]'>
                {t(`events.${item.event}` as any)}
              </p>
              <p className='text-main-black text-[16px] font-medium leading-[1.5]'>
                {t(`sources.${item.source}` as any)}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile Cards */}
        <div className='md:hidden flex flex-col gap-4'>
          {priceHistory.map((item, index) => (
            <div
              key={index}
              className='flex flex-col gap-2 py-4 border-t border-purple-92 first:border-t-0'
            >
              <p className='text-grey-500 text-xs font-medium leading-[1.4]'>{item.date}</p>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-main-black text-[16px] font-medium leading-[1.5]'>
                  {t(`events.${item.event}` as any)}
                </p>
                <p className='text-main-black text-[16px] font-bold leading-[1.5]'>
                  ${item.price.toLocaleString('en-US')}
                  {t('perMonth')}
                </p>
              </div>
              <p className='text-grey-500 text-xs font-medium leading-[1.4]'>
                {t(`sources.${item.source}` as any)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
