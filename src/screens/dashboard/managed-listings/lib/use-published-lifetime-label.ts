'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import { computePublishedHoursRemaining } from '@/entities/listing/lib/listing-published-lifetime';

import { formatPublishedLifetimeLabel } from './format-published-lifetime-label';

/**
 * Live-updating label (≈60s) for the 14-day published listing window — or null when N/A.
 */
export function usePublishedLifetimeLabel(
  status: string,
  publishedAt?: string | null
): { label: string | null; hoursLeft: number | null } {
  const t = useTranslations('ListingDetailPanel');

  const [hoursLeft, setHoursLeft] = React.useState<number | null>(() =>
    computePublishedHoursRemaining(publishedAt, status)
  );

  React.useEffect(() => {
    const sync = () => setHoursLeft(computePublishedHoursRemaining(publishedAt, status));
    sync();

    const initial = computePublishedHoursRemaining(publishedAt, status);
    if (initial === null) {
      return;
    }

    const interval = setInterval(sync, 60_000);
    return () => clearInterval(interval);
  }, [status, publishedAt]);

  if (hoursLeft === null) {
    return { label: null, hoursLeft: null };
  }

  return { label: formatPublishedLifetimeLabel(hoursLeft, t), hoursLeft };
}
