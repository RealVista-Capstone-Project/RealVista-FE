'use client';

import { BedSingle, Bath, MapPin } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import type { ChatListingData } from '@/entities/contact';

interface ChatListingCardProps {
  /**
   * Listing data to display
   */
  listing: ChatListingData;
  /**
   * Callback when card is clicked
   */
  onClick?: (listing: ChatListingData) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatListingCard component
 * Compact listing card embedded in chat messages
 */
export function ChatListingCard({ listing, onClick, className }: ChatListingCardProps) {
  const { title, image, price, currency, address, beds, bathrooms, area } = listing;

  return (
    <button
      type='button'
      onClick={() => onClick?.(listing)}
      className={cn(
        'flex w-full max-w-[280px] gap-3 rounded-lg border border-border bg-white p-2 text-left shadow-sm transition-all hover:shadow-md',
        'cursor-pointer',
        className
      )}
    >
      {/* Thumbnail */}
      <div className='relative h-16 w-20 flex-shrink-0'>
        <Image
          src={image}
          alt={title}
          fill
          className='rounded-md object-cover'
          sizes='80px'
        />
      </div>

      {/* Content */}
      <div className='flex min-w-0 flex-1 flex-col justify-between gap-1'>
        <p className='line-clamp-1 text-sm font-medium text-main-black'>{title}</p>

        <p className='text-base font-bold text-main-primary'>
          {currency ?? '$'}
          {price !== undefined && price !== null ? price.toLocaleString() : '0'}
        </p>

        {/* Property details */}
        {(beds || bathrooms || area) && (
          <div className='flex items-center gap-2 text-xs text-grey-500'>
            {beds && (
              <span className='flex items-center gap-0.5'>
                <BedSingle className='h-3 w-3' />
                {beds}
              </span>
            )}
            {bathrooms && (
              <span className='flex items-center gap-0.5'>
                <Bath className='h-3 w-3' />
                {bathrooms}
              </span>
            )}
            {area && <span className='flex items-center gap-0.5'>{area} m²</span>}
          </div>
        )}

        {/* Address */}
        {address && (
          <p className='flex items-center gap-1 truncate text-xs text-grey-500'>
            <MapPin className='h-3 w-3 flex-shrink-0' />
            <span className='truncate'>{address}</span>
          </p>
        )}
      </div>
    </button>
  );
}
