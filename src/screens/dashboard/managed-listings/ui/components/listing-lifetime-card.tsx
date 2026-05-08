'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Timer } from 'lucide-react';

import type { Listing } from '@/entities/listing';
import {
  LISTING_PUBLISHED_MAX_LIFETIME_HOURS,
  computePublishedHoursRemaining,
} from '@/entities/listing/lib/listing-published-lifetime';

import { formatPublishedLifetimeLabel } from '../../lib/format-published-lifetime-label';

interface ListingLifetimeCardProps {
  listing: Listing;
}

export function ListingLifetimeCard({ listing }: ListingLifetimeCardProps) {
  const t = useTranslations('ListingDetailPanel');

  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(() =>
    listing.status === 'PUBLISHED' && listing.published_at
      ? computePublishedHoursRemaining(listing.published_at, listing.status)
      : null
  );

  React.useEffect(() => {
    if (listing.status !== 'PUBLISHED' || !listing.published_at) {
      setTimeRemaining(null);
      return;
    }

    const publishedDate = listing.published_at;

    const tick = () => {
      const next = computePublishedHoursRemaining(publishedDate, listing.status);
      setTimeRemaining(next);
    };

    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [listing.status, listing.published_at]);

  if (listing.status !== 'PUBLISHED' || !listing.published_at || timeRemaining === null) {
    return null;
  }

  const totalDays = LISTING_PUBLISHED_MAX_LIFETIME_HOURS / 24;
  const remainingDays = Math.floor(timeRemaining / 24);
  const pct = Math.max(0, Math.min(100, (remainingDays / totalDays) * 100));

  const isUrgent = timeRemaining < 24;
  const isWarning = !isUrgent && timeRemaining < 72;

  return (
    <>
      {/* Header */}
      <div className='flex items-center gap-2'>
        <Timer className='h-4 w-4 text-primary' strokeWidth={2} />
        <h3 className='text-base font-bold text-foreground'>{t('lifetime.title')}</h3>
      </div>

      {/* Progress bar */}
      <div className='mt-1 space-y-1'>
        <div className={`h-2 w-full overflow-hidden rounded-full ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
          <div
            className={`h-full rounded-full transition-all ${isUrgent ? 'bg-red-500' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className='text-xs text-foreground'>
          {formatPublishedLifetimeLabel(timeRemaining, t)}
        </p>
      </div>

      {/* Note */}
      <p className='mt-2 text-xs italic text-muted-foreground'>{t('lifetime.tooltip')}</p>
    </>
  );
}
