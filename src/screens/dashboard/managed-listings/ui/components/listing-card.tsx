import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { formatVND } from '@/shared/lib/utils/format-currency';
import type { ManagedListing, ListingStatus } from '../../types/managed-listing';

interface ListingCardProps {
  listing: ManagedListing;
  isSelected: boolean;
  onClick: () => void;
}

const statusConfig: Record<ListingStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'DRAFT',
    className: 'bg-gray-100 text-gray-600',
  },
  PENDING: {
    label: 'PENDING',
    className: 'bg-yellow-50 text-yellow-600',
  },
  PUBLISHED: {
    label: 'PUBLISHED',
    className: 'bg-purple-94 text-main-primary',
  },
  SOLD: {
    label: 'SOLD',
    className: 'bg-green-50 text-green-600',
  },
  RENTED: {
    label: 'RENTED',
    className: 'bg-green-50 text-green-600',
  },
  ARCHIVED: {
    label: 'ARCHIVED',
    className: 'bg-gray-100 text-gray-600',
  },
};

export function ListingCard({ listing, isSelected, onClick }: ListingCardProps) {
  const status = statusConfig[listing.status];
  const address = listing.full_address || 'No address available';
  const area = listing.property?.total_area ? `${listing.property.total_area} sq m` : '';
  const formattedPrice = formatVND(listing.price);

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'w-full border-b border-purple-92/50 p-6 text-left transition-colors hover:bg-purple-98',
        isSelected && 'bg-purple-96'
      )}
    >
      <div className='flex items-center gap-4'>
        {/* Property Image */}
        <div className='relative h-16 w-20 shrink-0 overflow-hidden rounded-lg'>
          {listing.thumbnail ? (
            <Image src={listing.thumbnail} alt={listing.name} fill className='object-cover' />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-purple-98'>
              <span className='text-xs text-main-secondary/60'>No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          {/* Name & Listing Type */}
          <div className='flex items-center gap-2'>
            <h3 className='line-clamp-1 text-lg font-medium leading-snug tracking-[-0.09px] text-main-black'>
              {listing.name}
            </h3>
            <span
              className={cn(
                'shrink-0 rounded px-2 py-0.5 text-xs font-semibold',
                listing.listing_type === 'RENT'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-orange-50 text-orange-600'
              )}
            >
              {listing.listing_type === 'RENT' ? 'For Rent' : 'For Sale'}
            </span>
          </div>

          {/* Location */}
          <p className='line-clamp-1 text-sm font-normal leading-normal text-main-black/70'>
            {address}
          </p>

          {/* Price, Status & Area */}
          <div className='flex items-center gap-2 text-sm'>
            <span className='font-semibold text-main-primary'>{formattedPrice}</span>
            <span className='text-main-black/50'>•</span>
            <div className={cn('rounded-full px-2 py-0.5', status.className)}>
              <span className='text-xs font-bold leading-tight'>{status.label}</span>
            </div>
            {area && (
              <>
                <span className='text-main-black/50'>•</span>
                <span className='text-main-black/70'>{area}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
