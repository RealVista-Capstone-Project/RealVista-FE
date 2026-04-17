'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Info } from 'lucide-react';
import { differenceInHours, parseISO } from 'date-fns';

import type { Listing } from '@/entities/listing';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip/tooltip';

const LISTING_MAX_LIFETIME_DAYS = 14;
const LISTING_MAX_LIFETIME_HOURS = LISTING_MAX_LIFETIME_DAYS * 24;

interface ListingLifetimeCardProps {
  listing: Listing;
}

export function ListingLifetimeCard({ listing }: ListingLifetimeCardProps) {
  const t = useTranslations('ListingDetailPanel');

  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (listing.status !== 'PUBLISHED' || !listing.published_at) {
      return;
    }

    const calculateRemaining = () => {
      const publishedDate = parseISO(listing.published_at);
      const now = new Date();
      return LISTING_MAX_LIFETIME_HOURS - differenceInHours(now, publishedDate);
    };

    setTimeRemaining(calculateRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateRemaining());
    }, 60000);

    return () => clearInterval(interval);
  }, [listing.status, listing.published_at]);

  if (listing.status !== 'PUBLISHED' || !listing.published_at || timeRemaining === null) {
    return null;
  }

  const getLifetimeColor = (hours: number) => {
    if (hours >= 96) return 'bg-green-500';
    if (hours >= 24) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getLifetimeBarBg = (hours: number) => {
    if (hours >= 96) return 'bg-green-100';
    if (hours >= 24) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const getLifetimeText = (hours: number) => {
    const days = Math.floor(hours / 24);

    if (hours <= 0) {
      return t('lifetime.expired');
    }
    if (hours < 24) {
      return t('lifetime.hoursRemaining', { count: hours });
    }
    if (days === 1) {
      return t('lifetime.oneDayRemaining');
    }
    return t('lifetime.daysRemaining', { count: days });
  };

  return (
    <div className='flex items-center gap-4'>
      <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10'>
        <Clock className='h-4 w-4 text-primary' strokeWidth={2} />
      </div>
      <div className='flex-1'>
        <div className='mb-1 flex items-center gap-2'>
          <span className='text-sm font-semibold text-main-black'>{t('lifetime.title')}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type='button' className='flex items-center text-secondary/40 hover:text-secondary/70 transition-colors' aria-label={t('lifetime.tooltip')}>
                <Info className='h-3 w-3' strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent className='max-w-[220px] text-center text-xs'>
              {t('lifetime.tooltip')}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className='flex items-center gap-3'>
          <div className={`h-2 flex-1 overflow-hidden rounded-full ${getLifetimeBarBg(timeRemaining)}`}>
            <div
              className={`h-full rounded-full transition-all ${getLifetimeColor(timeRemaining)}`}
              style={{ width: `${Math.max(0, Math.min(100, (timeRemaining / LISTING_MAX_LIFETIME_HOURS) * 100))}%` }}
            />
          </div>
          <span className={`text-xs font-medium whitespace-nowrap ${timeRemaining >= 96 ? 'text-green-700' : timeRemaining >= 24 ? 'text-amber-700' : 'text-red-700'}`}>
            {getLifetimeText(timeRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
}
