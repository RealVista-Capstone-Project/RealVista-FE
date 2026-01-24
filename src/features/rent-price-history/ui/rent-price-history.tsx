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
  { date: '09/02/2019', price: 1800, event: 'Listed for Sale', source: 'Public Records' },
  { date: '25/11/2019', price: 1900, event: 'Black Friday', source: 'Public Records' },
  { date: '03/04/2020', price: 2000, event: 'Rented', source: 'Public Records' },
  { date: '10/10/2021', price: 2600, event: 'Price Change', source: 'Estatery' },
  { date: '28/12/2021', price: 2700, event: 'Listed for Sale', source: 'Estatery' },
];

/**
 * RentPriceHistory component displays property price history
 * with responsive table (desktop) and card (mobile) layouts
 */
export function RentPriceHistory({ property }: RentPriceHistoryProps) {
  const priceHistory = defaultPriceHistory;

  return (
    <div className='flex flex-col gap-8'>
      <h2 className='text-main-black text-[24px] font-bold leading-[1.5] tracking-[-0.24px]'>
        Rent Price History for {property.title}
      </h2>
      <div className='bg-purple-98/84 rounded-lg p-4'>
        {/* Desktop Table */}
        <div className='hidden md:block'>
          {/* Table Header */}
          <div className='grid grid-cols-[220px_1fr_1fr_1fr] gap-4 mb-4'>
            <p className='text-main-black text-[16px] font-bold leading-[1.5]'>Date</p>
            <p className='text-main-black text-[16px] font-bold leading-[1.5]'>Price</p>
            <p className='text-main-black text-[16px] font-bold leading-[1.5]'>Event</p>
            <p className='text-main-black text-[16px] font-bold leading-[1.5]'>Source</p>
          </div>
          {/* Table Body */}
          {priceHistory.map((item, index) => (
            <div
              key={index}
              className='grid grid-cols-[220px_1fr_1fr_1fr] gap-4 py-4 border-t border-purple-92'
            >
              <p className='text-grey-500 text-[16px] font-medium leading-[1.5]'>{item.date}</p>
              <p className='text-main-black text-[16px] font-medium leading-[1.5]'>
                ${item.price.toLocaleString()}/mo
              </p>
              <p className='text-main-black text-[16px] font-medium leading-[1.5]'>{item.event}</p>
              <p className='text-main-black text-[16px] font-medium leading-[1.5]'>{item.source}</p>
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
                <p className='text-main-black text-[16px] font-medium leading-[1.5]'>{item.event}</p>
                <p className='text-main-black text-[16px] font-bold leading-[1.5]'>
                  ${item.price.toLocaleString()}/mo
                </p>
              </div>
              <p className='text-grey-500 text-xs font-medium leading-[1.4]'>{item.source}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
