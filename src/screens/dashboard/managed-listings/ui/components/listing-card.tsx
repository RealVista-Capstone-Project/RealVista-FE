import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
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
    label: 'VACANT',
    className: 'bg-purple-94 text-main-primary',
  },
  SOLD: {
    label: 'SOLD',
    className: 'bg-green-50 text-green-600',
  },
  RENTED: {
    label: 'OCCUPIED',
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

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'w-full border-b border-purple-92/50 p-6 text-left transition-colors hover:bg-purple-98',
        isSelected && 'bg-purple-96'
      )}
    >
      <div className='flex items-center justify-between gap-4'>
        {/* Left: Image & Name */}
        <div className='flex items-center gap-4'>
          {/* Property Image */}
          <div className='relative h-14 w-18 shrink-0 overflow-hidden rounded-lg'>
            {listing.thumbnail ? (
              <Image src={listing.thumbnail} alt={listing.name} fill className='object-cover' />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-purple-98'>
                <span className='text-xs text-main-secondary/60'>No image</span>
              </div>
            )}
          </div>

          {/* Name & Location */}
          <div className='flex flex-col gap-2'>
            <h3 className='line-clamp-1 text-lg font-medium leading-snug tracking-[-0.09px] text-main-black'>
              {listing.name}
            </h3>
            <p className='line-clamp-1 text-base font-normal leading-normal text-main-black/70'>
              {address}
            </p>
          </div>
        </div>

        {/* Right: Status & Area */}
        <div className='flex flex-col items-end gap-2'>
          <div className={cn('rounded-2xl px-3 py-1', status.className)}>
            <span className='text-xs font-bold leading-tight'>{status.label}</span>
          </div>
          {area && (
            <p className='text-base font-normal leading-normal text-main-black/70'>{area}</p>
          )}
        </div>
      </div>
    </button>
  );
}
