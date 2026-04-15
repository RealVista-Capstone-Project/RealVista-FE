'use client';

import { BedSingle, Bath, MapPin, FileText } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { ChatListingData } from '@/entities/contact';

interface ChatListingCardProps {
  /**
   * Listing data to display
   */
  listing: ChatListingData;
  /**
   * Callback when the card body is clicked (opens listing detail)
   */
  onClick?: (listing: ChatListingData) => void;
  /**
   * Callback when the "Create Contract" button is clicked
   */
  onCreateContract?: (listing: ChatListingData) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatListingCard component
 * Compact listing card embedded in chat messages.
 * Card body click → listing detail (new tab)
 * "Create Contract" button → contract wizard pre-fill
 */
export function ChatListingCard({ listing, onClick, onCreateContract, className }: ChatListingCardProps) {
  const t = useTranslations('Messages');
  const { title, image, price, currency, address, beds, bathrooms, area } = listing;

  return (
    <div
      className={cn(
        'flex w-full max-w-[280px] flex-col rounded-lg border border-border bg-white shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      {/* Clickable card body */}
      <button
        type='button'
        onClick={() => onClick?.(listing)}
        className='flex w-full gap-3 p-2 text-left'
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

      {/* Create Contract CTA — only rendered when prop is provided */}
      {onCreateContract && (
        <div className='border-t border-border px-2 pb-2 pt-1.5'>
          <button
            type='button'
            onClick={() => onCreateContract(listing)}
            className='flex w-full items-center justify-center gap-1.5 rounded-md bg-main-primary/8 py-1.5 text-xs font-medium text-main-primary transition-colors hover:bg-main-primary/15'
          >
            <FileText className='h-3.5 w-3.5' />
            {t('createContract')}
          </button>
        </div>
      )}
    </div>
  );
}
