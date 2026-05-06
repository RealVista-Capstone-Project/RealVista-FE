import Image from 'next/image';
import { Heart, BedSingle, Bath } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

export interface PropertyCardFeaturedProps {
  title: string;
  address: string;
  price: number;
  currency?: string;
  currencyAfter?: boolean;
  numberLocale?: string;
  period?: string;
  beds: number;
  bathrooms: number;
  area: number;
  areaUnit?: string;
  imageUrl: string;
  badge?: string;
  bedsLabel?: string;
  bathroomsLabel?: string;
  rentSaleLabel?: string;
  applyLabel?: string;
  onApply?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  className?: string;
}

export function PropertyCardFeatured({
  title,
  address,
  price,
  currency = '$',
  currencyAfter = false,
  numberLocale = 'en-US',
  period = '/month',
  beds,
  bathrooms,
  area,
  areaUnit = 'm²',
  imageUrl,
  badge,
  bedsLabel = 'Beds',
  bathroomsLabel = 'Bathrooms',
  rentSaleLabel = 'Rent Sale',
  applyLabel = 'Apply now',
  onApply,
  onFavorite,
  isFavorite = false,
  className,
}: PropertyCardFeaturedProps) {
  const formattedPrice = new Intl.NumberFormat(numberLocale).format(price);

  // Area Icon component matching the homepage card
  const AreaIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'>
      <g clipPath='url(#clip0_272_7379)'>
        <path
          d='M8.83149 15.5437L3.45631 10.1685C2.8479 9.56011 2.8479 8.43989 3.45631 7.83148L8.83149 2.45631C9.43989 1.8479 10.5601 1.8479 11.1685 2.45631L16.5437 7.83148C17.1521 8.43989 17.1521 9.56011 16.5437 10.1685L11.1685 15.5437C10.5601 16.1521 9.43989 16.1521 8.83149 15.5437V15.5437Z'
          stroke='var(--primary)'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M2 13.1719L6.36371 17.5356'
          stroke='var(--primary)'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M13.6362 17.5356L17.9999 13.1719'
          stroke='var(--primary)'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </g>
      <defs>
        <clipPath id='clip0_272_7379'>
          <rect width='20' height='20' fill='white' />
        </clipPath>
      </defs>
    </svg>
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-[1.5px] border-primary/10 bg-white transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Image */}
      <div className='relative aspect-[4/3] w-full overflow-hidden rounded-t-xl'>
        <Image
          src={imageUrl}
          alt={title}
          fill
          className='object-cover transition-transform duration-700 hover:scale-110'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px'
          priority
          unoptimized
        />

        {/* Badge */}
        {badge && (
          <div className='absolute left-4 top-4'>
            <div className='flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 shadow-sm'>
              <svg
                width='12'
                height='12'
                viewBox='0 0 12 12'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z'
                  fill='white'
                />
              </svg>
              <span className='text-xs font-bold uppercase tracking-wide text-white'>{badge}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className='p-6'>
        {/* Title & Favorite */}
        <div className='mb-3 flex items-start justify-between gap-3'>
          <div className='flex-1'>
            <h3 className='mb-1 text-2xl font-bold leading-[1.5] tracking-[-1px] text-foreground truncate'>
              {title}
            </h3>
            <p className='text-base font-normal leading-[1.5] text-muted-foreground line-clamp-2'>
              {address}
            </p>
          </div>
          <button
            onClick={onFavorite}
            className='flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary/20 bg-white transition-colors hover:bg-primary/5'
            aria-label='Add to favorites'
          >
            <Heart
              className={cn(
                'h-5 w-5',
                isFavorite ? 'fill-red-500 text-red-500' : 'text-primary'
              )}
              strokeWidth={2.3}
            />
          </button>
        </div>

        {/* Divider */}
        <div className='mb-4 h-[1px] bg-primary/10' />

        {/* Features */}
        <div className='mb-4 flex items-center justify-center gap-4'>
          <div className='flex items-center gap-1.5'>
            <BedSingle className='h-5 w-5 text-primary' strokeWidth={2.3} />
            <span className='text-sm font-normal leading-[1.4] text-muted-foreground'>
              {beds} {bedsLabel}
            </span>
          </div>
          <div className='flex items-center gap-1.5'>
            <Bath className='h-5 w-5 text-primary' strokeWidth={2.3} />
            <span className='text-sm font-normal leading-[1.4] text-muted-foreground'>
              {bathrooms} {bathroomsLabel}
            </span>
          </div>
          <div className='flex items-center gap-1.5'>
            <AreaIcon />
            <span className='text-sm font-normal leading-[1.4] text-muted-foreground'>
              {area}
              {areaUnit}
            </span>
          </div>
        </div>

        {/* Price & Apply Button */}
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>{rentSaleLabel}</p>
            <p className='flex items-baseline gap-1'>
              <span className='text-2xl font-bold leading-[1.5] tracking-[-1px] text-primary'>
                {!currencyAfter && currency}
                {formattedPrice}
                {currencyAfter && currency}
              </span>
              <span className='text-base font-normal leading-[1.5] text-muted-foreground'>{period}</span>
            </p>
          </div>
          <Button
            onClick={onApply}
            className='h-11 rounded-xl bg-foreground px-5 text-sm font-semibold text-white hover:bg-foreground/90 transition-colors mr-2'
          >
            {applyLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
