import * as React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { formatVND } from '@/shared/lib/utils/format-currency';
import type { ManagedListing } from '../../types/managed-listing';
import { LISTING_STATUS_CONFIG, ListingStatus } from '../../types/managed-listing';

interface ListingCardProps {
  listing: ManagedListing;
  isSelected: boolean;
  onClick: () => void;
}

export function ListingCard({ listing, isSelected, onClick }: ListingCardProps) {
  const t = useTranslations('ListingCard');
  const tStatus = useTranslations('ListingStatus');
  const status =
    LISTING_STATUS_CONFIG[listing.status as ListingStatus] ??
    LISTING_STATUS_CONFIG[ListingStatus.DRAFT];
  const address = listing.full_address || t('noAddress');
  const area = listing.property?.total_area ? `${listing.property.total_area} sq m` : '';
  const formattedPrice = formatVND(listing.price);

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'w-full border-b border-purple-92/50 p-4 sm:p-6 text-left transition-colors hover:bg-purple-98',
        isSelected && 'bg-purple-96'
      )}
    >
      <div className='flex items-center gap-3 sm:gap-4'>
        {/* Property Image */}
        <div className='relative h-16 w-20 shrink-0 overflow-hidden rounded-lg'>
          {listing.primary_media_thumbnail_url || listing.thumbnail ? (
            <Image
              src={listing.primary_media_thumbnail_url || listing.thumbnail || ''}
              alt={listing.name}
              fill
              className='object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-purple-98'>
              <span className='text-xs text-main-secondary/60'>{t('noImage')}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          {/* Name & Listing Type */}
          <div className='flex items-center gap-2'>
            <h3 className='line-clamp-1 text-base sm:text-lg font-medium leading-snug tracking-[-0.09px] text-main-black'>
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
              {listing.listing_type === 'RENT' ? t('listingType.rent') : t('listingType.sale')}
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
              <span className='text-xs font-bold leading-tight'>{tStatus(status.labelKey)}</span>
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
