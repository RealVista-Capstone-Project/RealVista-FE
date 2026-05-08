'use client';

import * as React from 'react';
import { Eye, Users, Calendar, TrendingUp, CircleHelp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip';
import { useListingAnalytics } from '../api/use-listing-analytics';
import { formatNumber } from '@/shared/lib/utils/format-currency';

interface ListingMetricsCardProps {
  listingId: string;
}

export function ListingMetricsCard({ listingId }: ListingMetricsCardProps) {
  const { data, isLoading, isError } = useListingAnalytics(listingId);
  const t = useTranslations('ListingMetricsCard');

  if (isError) {
    return null;
  }

  if (isLoading) {
    return (
      <div className='flex h-full flex-col rounded-lg p-4 sm:p-5'>
        <div className='mb-4 h-5 w-40 animate-pulse rounded bg-primary/15' />
        <div className='grid flex-1 grid-cols-2 gap-3'>
          {[...Array(4)].map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className='flex h-full flex-col rounded-lg p-4 sm:p-5'>
      <h2 className='mb-4 text-base font-bold text-foreground'>{t('title')}</h2>

      <div className='grid flex-1 grid-cols-2 gap-3'>
        <MetricItem
          icon={<Eye className='h-4 w-4' strokeWidth={2} />}
          label={t('metrics.totalViews')}
          value={formatNumber(data.total_views)}
        />
        <MetricItem
          icon={<Users className='h-4 w-4' strokeWidth={2} />}
          label={t('metrics.uniqueViewers')}
          value={formatNumber(data.unique_viewers)}
        />
        <MetricItem
          icon={<Calendar className='h-4 w-4' strokeWidth={2} />}
          label={t('metrics.tourBookings')}
          value={formatNumber(data.tour_bookings)}
        />
        <MetricItem
          icon={<TrendingUp className='h-4 w-4' strokeWidth={2} />}
          label={t('metrics.conversionRate')}
          value={`${data.conversion_rate}%`}
          tooltip={t('metrics.conversionRateTooltip')}
        />
      </div>
    </div>
  );
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
}

function MetricItem({ icon, label, value, tooltip }: MetricItemProps) {
  return (
    <div className='flex h-full flex-col gap-3 rounded-xl bg-primary/[0.04] px-4 py-4'>
      <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
        {icon}
      </div>
      <div className='min-w-0'>
        <div className='flex items-center gap-1'>
          <p className='text-xs font-medium text-muted-foreground'>{label}</p>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleHelp className='h-3 w-3 shrink-0 cursor-help text-muted-foreground/50 transition-colors hover:text-muted-foreground' />
              </TooltipTrigger>
              <TooltipContent side='top' align='start'>
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className='text-xl font-bold leading-tight tracking-tight text-foreground'>{value}</p>
      </div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className='flex items-center gap-3 rounded-xl bg-primary/[0.04] px-3 py-3'>
      <div className='h-9 w-9 animate-pulse rounded-lg bg-primary/15' />
      <div className='flex-1 space-y-1.5'>
        <div className='h-3 w-16 animate-pulse rounded bg-primary/15' />
        <div className='h-5 w-10 animate-pulse rounded bg-primary/15' />
      </div>
    </div>
  );
}
