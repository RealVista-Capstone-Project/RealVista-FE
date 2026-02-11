'use client';

import { Bath, Heart, BedSingle } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button/button';
import { formatVND } from '@/shared/lib/utils/format-currency';

export interface RealVistaListingCardProps {
  id: string;
  image: string;
  title: string;
  address: string;
  price: number;
  currency?: string;
  beds: number;
  bathrooms: number;
  area: number;
  areaUnit?: string;
  isPopular?: boolean;
  isFavorite?: boolean;
  variant?: 'grid' | 'list';
  listingType?: 'RENT' | 'SALE';
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

export function RealVistaListingCard({
  id,
  image,
  title,
  address,
  price,
  beds,
  bathrooms,
  area,
  areaUnit = 'm²',
  isPopular = false,
  isFavorite = false,
  variant = 'grid',
  listingType = 'RENT',
  onToggleFavorite,
  onClick,
  className,
}: RealVistaListingCardProps) {
  const t = useTranslations('PropertyCard');

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(id);
  };

  const handleCardClick = () => {
    onClick?.(id);
  };

  // Shared Area Icon component to avoid duplication
  const AreaIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'>
      <g clipPath='url(#clip0_272_7379)'>
        <path
          d='M8.83149 15.5437L3.45631 10.1685C2.8479 9.56011 2.8479 8.43989 3.45631 7.83148L8.83149 2.45631C9.43989 1.8479 10.5601 1.8479 11.1685 2.45631L16.5437 7.83148C17.1521 8.43989 17.1521 9.56011 16.5437 10.1685L11.1685 15.5437C10.5601 16.1521 9.43989 16.1521 8.83149 15.5437V15.5437Z'
          stroke='#7065F0'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M2 13.1719L6.36371 17.5356'
          stroke='#7065F0'
          strokeWidth='2.1'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M13.6362 17.5356L17.9999 13.1719'
          stroke='#7065F0'
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

  // Shared Property Specs row
  const PropertySpecs = () => (
    <div className='flex items-center gap-4'>
      <div className='flex items-center gap-1.5'>
        <BedSingle className='h-5 w-5 text-main-primary' strokeWidth={2.3} />
        <span className='text-sm font-normal leading-[1.4] text-grey-500'>
          {beds} {t('beds')}
        </span>
      </div>
      <div className='flex items-center gap-1.5'>
        <Bath className='h-5 w-5 text-main-primary' strokeWidth={2.3} />
        <span className='text-sm font-normal leading-[1.4] text-grey-500'>
          {bathrooms} {t('bathrooms')}
        </span>
      </div>
      <div className='flex items-center gap-1.5'>
        <AreaIcon />
        <span className='text-sm font-normal leading-[1.4] text-grey-500'>
          {area}
          {areaUnit}
        </span>
      </div>
    </div>
  );

  // Shared Favorite Button
  const FavoriteButton = () => (
    <Button
      onClick={handleFavoriteClick}
      className='flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-purple-92 bg-white transition-colors hover:bg-purple-98'
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      variant='outline'
      size='icon'
    >
      <Heart
        className={cn('h-5 w-5 text-main-primary', isFavorite && 'fill-main-primary')}
        strokeWidth={2.3}
      />
    </Button>
  );

  // Shared Popular Badge
  const PopularBadge = () =>
    isPopular ? (
      <div className='absolute -bottom-3.75 -left-2 z-10'>
        <div className='relative h-8 rounded-br-lg rounded-tl-lg rounded-tr-lg bg-main-primary px-4 py-2'>
          <div className='flex items-center gap-1'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
            >
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M4.0001 1.59961C4.21227 1.59961 4.41575 1.68389 4.56578 1.83392C4.71581 1.98395 4.8001 2.18744 4.8001 2.39961V3.19961H5.6001C5.81227 3.19961 6.01575 3.28389 6.16578 3.43392C6.31581 3.58395 6.4001 3.78744 6.4001 3.99961C6.4001 4.21178 6.31581 4.41527 6.16578 4.56529C6.01575 4.71532 5.81227 4.79961 5.6001 4.79961H4.8001V5.59961C4.8001 5.81178 4.71581 6.01527 4.56578 6.16529C4.41575 6.31532 4.21227 6.39961 4.0001 6.39961C3.78792 6.39961 3.58444 6.31532 3.43441 6.16529C3.28438 6.01527 3.2001 5.81178 3.2001 5.59961V4.79961H2.4001C2.18792 4.79961 1.98444 4.71532 1.83441 4.56529C1.68438 4.41527 1.6001 4.21178 1.6001 3.99961C1.6001 3.78744 1.68438 3.58395 1.83441 3.43392C1.98444 3.28389 2.18792 3.19961 2.4001 3.19961H3.2001V2.39961C3.2001 2.18744 3.28438 1.98395 3.43441 1.83392C3.58444 1.68389 3.78792 1.59961 4.0001 1.59961ZM4.0001 9.59961C4.21227 9.59961 4.41575 9.68389 4.56578 9.83392C4.71581 9.98395 4.8001 10.1874 4.8001 10.3996V11.1996H5.6001C5.81227 11.1996 6.01575 11.2839 6.16578 11.4339C6.31581 11.584 6.4001 11.7874 6.4001 11.9996C6.4001 12.2118 6.31581 12.4153 6.16578 12.5653C6.01575 12.7153 5.81227 12.7996 5.6001 12.7996H4.8001V13.5996C4.8001 13.8118 4.71581 14.0153 4.56578 14.1653C4.41575 14.3153 4.21227 14.3996 4.0001 14.3996C3.78792 14.3996 3.58444 14.3153 3.43441 14.1653C3.28438 14.0153 3.2001 13.8118 3.2001 13.5996V12.7996H2.4001C2.18792 12.7996 1.98444 12.7153 1.83441 12.5653C1.68438 12.4153 1.6001 12.2118 1.6001 11.9996C1.6001 11.7874 1.68438 11.584 1.83441 11.4339C1.98444 11.2839 2.18792 11.1996 2.4001 11.1996H3.2001V10.3996C3.2001 10.1874 3.28438 9.98395 3.43441 9.83392C3.58444 9.68389 3.78792 9.59961 4.0001 9.59961ZM9.6001 1.59961C9.77665 1.59955 9.94826 1.6579 10.0882 1.76556C10.2281 1.87322 10.3285 2.02414 10.3737 2.19481L11.3169 5.75961L14.0001 7.30681C14.1217 7.37703 14.2227 7.47802 14.2929 7.59963C14.3631 7.72124 14.4001 7.85919 14.4001 7.99961C14.4001 8.14003 14.3631 8.27798 14.2929 8.39959C14.2227 8.5212 14.1217 8.62219 14.0001 8.69241L11.3169 10.2404L10.3729 13.8044C10.3276 13.9749 10.2273 14.1257 10.0874 14.2332C9.94758 14.3408 9.77611 14.3991 9.5997 14.3991C9.42329 14.3991 9.25182 14.3408 9.11198 14.2332C8.97214 14.1257 8.87178 13.9749 8.8265 13.8044L7.8833 10.2396L5.2001 8.69241C5.07849 8.62219 4.97751 8.5212 4.9073 8.39959C4.83709 8.27798 4.80013 8.14003 4.80013 7.99961C4.80013 7.85919 4.83709 7.72124 4.9073 7.59963C4.97751 7.47802 5.07849 7.37703 5.2001 7.30681L7.8833 5.75881L8.8273 2.19481C8.87246 2.02427 8.97272 1.87345 9.11249 1.7658C9.25226 1.65816 9.42368 1.59973 9.6001 1.59961Z'
                fill='white'
              />
            </svg>
            <span
              className='text-xs font-bold uppercase leading-4 tracking-[0.5px] text-white'
              style={{ fontFeatureSettings: "'ss06', 'ss04', 'liga' 0" }}
            >
              POPULAR
            </span>
          </div>
          <div className='absolute left-0 top-full h-1 w-1'>
            <svg
              width='8'
              height='8'
              viewBox='0 0 8 8'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              preserveAspectRatio='none'
              className='block'
              style={{ overflow: 'visible' }}
            >
              <path d='M8 8L0 0H8V8Z' fill='#5245ED' />
            </svg>
          </div>
        </div>
      </div>
    ) : null;

  // ── List variant ──
  if (variant === 'list') {
    return (
      <div
        className={cn(
          'flex rounded-lg border-[1.5px] border-purple-96 bg-white transition-shadow hover:shadow-md overflow-hidden',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Image – fixed width */}
        <div className='relative w-[280px] min-h-[200px] shrink-0'>
          <Image src={image} alt={title} fill className='object-cover' sizes='280px' />
          <PopularBadge />
        </div>

        {/* Details */}
        <div className='flex flex-1 flex-col justify-between p-5'>
          {/* Top: Price + Favorite */}
          <div>
            <div className='mb-2 flex items-start justify-between'>
              <div className='flex items-baseline gap-1'>
                <span className='text-xl font-bold leading-[1.4] tracking-[-0.5px] text-main-primary'>
                  {formatVND(price)}
                </span>
                {listingType === 'RENT' && (
                  <span className='text-sm font-normal leading-[1.5] text-grey-500'>
                    {t('perMonth')}
                  </span>
                )}
              </div>
              <FavoriteButton />
            </div>

            {/* Title */}
            <h3 className='mb-1 text-lg font-bold leading-[1.4] tracking-[-0.5px] text-main-black truncate'>
              {title}
            </h3>

            {/* Address */}
            <p className='text-sm font-normal leading-[1.5] text-grey-500 line-clamp-1'>
              {address}
            </p>
          </div>

          {/* Bottom: Specs */}
          <div className='mt-3 border-t border-purple-92 pt-3'>
            <PropertySpecs />
          </div>
        </div>
      </div>
    );
  }

  // ── Grid variant (default) ──
  return (
    <div
      className={cn(
        'rounded-lg border-[1.5px] border-purple-96 bg-white transition-shadow hover:shadow-md flex flex-col h-full',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Property Image */}
      <div className='relative aspect-[16/10] rounded-t-lg'>
        <Image
          src={image}
          alt={title}
          fill
          className='rounded-t-lg object-cover'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        />
        <PopularBadge />
      </div>

      {/* Property Details */}
      <div className='p-6 flex-1 flex flex-col'>
        {/* Price and Favorite */}
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-baseline gap-1'>
            <span className='text-2xl font-bold leading-[1.5] tracking-[-1px] text-main-primary'>
              {formatVND(price)}
            </span>
            {listingType === 'RENT' && (
              <span className='text-base font-normal leading-[1.5] text-grey-500'>
                {t('perMonth')}
              </span>
            )}
          </div>
          <FavoriteButton />
        </div>

        {/* Title */}
        <h3 className='mb-1 text-2xl font-bold leading-[1.5] tracking-[-1px] text-main-black truncate'>
          {title}
        </h3>

        {/* Address */}
        <p className='mb-4 text-base font-normal leading-[1.5] text-grey-500 line-clamp-2 min-h-[48px]'>
          {address}
        </p>

        {/* Divider Line */}
        <div className='mb-4 h-[1px] bg-purple-92 mt-auto' />

        {/* Property Specs */}
        <div className='flex items-center justify-center'>
          <PropertySpecs />
        </div>
      </div>
    </div>
  );
}
