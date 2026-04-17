import * as React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatVND } from '@/shared/lib/utils/format-currency';
import type { ManagedListing } from '../../types/managed-listing';
import { LISTING_STATUS_CONFIG, ListingStatus } from '../../types/managed-listing';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui';

interface ListingCardProps {
  listing: ManagedListing;
  isSelected: boolean;
  onClick: () => void;
}

export function ListingCard({ listing, isSelected, onClick }: ListingCardProps) {
  const t = useTranslations('ListingCard');
  const tStatus = useTranslations('ListingStatus');
  const tManagedListings = useTranslations('ManagedListings');
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
        'w-full border-b border-primary/20 p-4 sm:p-6 text-left transition-colors hover:bg-primary/5',
        isSelected && 'bg-primary/5'
      )}
    >
      <div className='flex items-center gap-3 sm:gap-4'>
        <div className='relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-primary/5'>
          {(() => {
            const thumbUrl = listing.primary_media_thumbnail_url || listing.thumbnail;
            const isVideoThumb = thumbUrl?.toLowerCase().endsWith('.mp4');

            if (thumbUrl && !isVideoThumb) {
              return (
                <Image
                  src={thumbUrl}
                  alt={listing.name}
                  fill
                  className='object-cover'
                />
              );
            }

            if (listing.total_videos && listing.total_videos > 0) {
              return (
                <div className='flex h-full w-full flex-col items-center justify-center'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path d='M8 5V19L19 12L8 5Z' />
                    </svg>
                  </div>
                  <span className='mt-1 text-[10px] font-medium text-primary'>Video</span>
                </div>
              );
            }

            return (
              <div className='flex h-full w-full items-center justify-center'>
                <span className='text-xs text-muted-foreground'>{t('noImage')}</span>
              </div>
            );
          })()}
        </div>

        {/* Content */}
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          {/* Name & Listing Type */}
          <div className='flex items-center gap-2'>
            <h3 className='line-clamp-1 text-base sm:text-lg font-medium leading-snug tracking-[-0.09px] text-foreground'>
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
          <p className='line-clamp-1 text-sm font-normal leading-normal text-foreground/70'>
            {address}
          </p>

          {/* Price, Status & Area */}
          <div className='flex items-center gap-2 text-sm'>
            <span className='font-semibold text-primary'>{formattedPrice}</span>
            <span className='text-foreground/50'>•</span>
            <div className='flex items-center gap-1.5'>
              <div className={cn('rounded-full px-2 py-0.5', status.className)}>
                <span className='text-xs font-bold leading-tight'>{tStatus(status.labelKey)}</span>
              </div>
              {(listing.status === ListingStatus.DRAFT || listing.status === ListingStatus.ARCHIVED) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type='button' className='text-primary hover:text-primary/80 transition-colors' onClick={(e) => e.stopPropagation()}>
                      <Info className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='top' className='max-w-[180px]'>
                    {tManagedListings('draftRuleTooltip')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {area && (
              <>
                <span className='text-foreground/50'>•</span>
                <span className='text-foreground/70'>{area}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
