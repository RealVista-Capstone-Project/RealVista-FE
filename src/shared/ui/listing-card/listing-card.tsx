'use client';

import { Bath, Ruler, Heart, BedSingle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface ListingCardProps {
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
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

export function ListingCard({
  id,
  image,
  title,
  address,
  price,
  currency = '$',
  beds,
  bathrooms,
  area,
  areaUnit = 'm²',
  isPopular = false,
  isFavorite = false,
  onToggleFavorite,
  onClick,
  className,
}: ListingCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(id);
  };

  const handleCardClick = () => {
    onClick?.(id);
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border-[1.5px] border-purple-96 bg-white transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Property Image */}
      <div className='relative aspect-[16/10] overflow-hidden'>
        <img src={image} alt={title} className='size-full object-cover' />

        {/* Popular Badge */}
        {isPopular && (
          <div className='absolute bottom-0 left-0'>
            {/* Main badge body with special rounded corners */}
            <div className='relative h-8 rounded-br-lg rounded-tl-lg rounded-tr-lg bg-main-primary px-4 py-2'>
              <div className='flex items-center gap-1'>
                {/* Star Icon - 16x16 */}
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M8 1.33334L10.06 5.50667L14.6667 6.18001L11.3333 9.42668L12.12 14.0133L8 11.8467L3.88 14.0133L4.66667 9.42668L1.33334 6.18001L5.94 5.50667L8 1.33334Z'
                    fill='white'
                    stroke='white'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                {/* Text */}
                <span
                  className='text-xs font-bold uppercase leading-4 tracking-[0.5px] text-white'
                  style={{ fontFeatureSettings: "'ss06', 'ss04', 'liga' 0" }}
                >
                  POPULAR
                </span>
              </div>
            </div>
            {/* Decorative cutout at bottom-left corner */}
            <div className='absolute left-0 top-8 h-2 w-2'>
              <svg width='8' height='8' viewBox='0 0 8 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M0 8V0C0 4.41828 3.58172 8 8 8H0Z' fill='#7065F0' />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className='p-6'>
        {/* Price and Favorite */}
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-baseline gap-1'>
            <span className='text-2xl font-bold leading-[1.5] tracking-[-1px] text-main-primary'>
              {currency}
              {price.toLocaleString()}
            </span>
            <span className='text-base font-normal leading-[1.5] text-grey-500'>/month</span>
          </div>

          <button
            onClick={handleFavoriteClick}
            className='flex size-10 items-center justify-center rounded-full border-[1.5px] border-purple-92 bg-white transition-colors hover:bg-purple-98'
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={cn(
                'h-5 w-5 text-main-primary',
                isFavorite && 'fill-main-primary'
              )}
              strokeWidth={2.3}
            />
          </button>
        </div>

        {/* Title */}
        <h3 className='mb-1 text-2xl font-bold leading-[1.5] tracking-[-1px] text-main-black'>
          {title}
        </h3>

        {/* Address */}
        <p className='mb-4 text-base font-normal leading-[1.5] text-grey-500'>{address}</p>

        {/* Divider Line */}
        <div className='mb-4 h-[1px] bg-purple-92' />

        {/* Property Specs */}
        <div className='flex items-center gap-4'>
          {/* Beds */}
          <div className='flex items-center gap-1.5'>
            <BedSingle className='h-5 w-5 text-main-primary' strokeWidth={2.3} />
            <span className='text-sm font-normal leading-[1.4] text-grey-500'>
              {beds} Beds
            </span>
          </div>

          {/* Bathrooms */}
          <div className='flex items-center gap-1.5'>
            <Bath className='h-5 w-5 text-main-primary' strokeWidth={2.3} />
            <span className='text-sm font-normal leading-[1.4] text-grey-500'>
              {bathrooms} Bathrooms
            </span>
          </div>

          {/* Area */}
          <div className='flex items-center gap-1.5'>
            <Ruler className='h-5 w-5 text-main-primary' strokeWidth={2.3} />
            <span className='text-sm font-normal leading-[1.4] text-grey-500'>
              {area}
              {areaUnit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
