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

/**
 * Displays listing performance metrics
 * Shows total views, unique viewers, tour bookings, and conversion rate
 */
export function ListingMetricsCard({ listingId }: ListingMetricsCardProps) {
  const { data, isLoading, isError } = useListingAnalytics(listingId);
  const t = useTranslations('ListingMetricsCard');

  if (isError) {
    return null; // Gracefully hide if analytics fail to load
  }

  if (isLoading) {
    return (
      <div className='rounded-lg border border-primary/20 p-6'>
        <h2 className='mb-6 text-xl font-bold leading-[1.6] tracking-[-0.1px] text-foreground'>
          {t('title')}
        </h2>
        <div className='grid grid-cols-2 gap-6 sm:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const analytics = data;

  if (!analytics) {
    return null;
  }

  return (
    <div className='rounded-lg border border-primary/20 p-6'>
      <h2 className='mb-6 text-xl font-bold leading-[1.6] tracking-[-0.1px] text-foreground'>
        {t('title')}
      </h2>

      <div className='grid grid-cols-2 gap-6 sm:grid-cols-4'>
        <MetricItem
          icon={<Eye className='h-6 w-6' strokeWidth={2} />}
          label={t('metrics.totalViews')}
          value={formatNumber(analytics.total_views)}
        />
        <MetricItem
          icon={<Users className='h-6 w-6' strokeWidth={2} />}
          label={t('metrics.uniqueViewers')}
          value={formatNumber(analytics.unique_viewers)}
        />
        <MetricItem
          icon={<Calendar className='h-6 w-6' strokeWidth={2} />}
          label={t('metrics.tourBookings')}
          value={formatNumber(analytics.tour_bookings)}
        />
        <MetricItem
          icon={<TrendingUp className='h-6 w-6' strokeWidth={2} />}
          label={t('metrics.conversionRate')}
          value={`${analytics.conversion_rate}%`}
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
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-1.5'>
        <p className='text-base font-medium leading-[1.5] text-muted-foreground'>{label}</p>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleHelp className='h-4 w-4 cursor-help text-muted-foreground/60 transition-colors hover:text-muted-foreground' />
            </TooltipTrigger>
            <TooltipContent side='top' align='start'>
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <div className='text-foreground/50'>{icon}</div>
        <p className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-foreground'>
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='h-6 w-24 animate-pulse rounded bg-primary/15' />
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 animate-pulse rounded bg-primary/15' />
        <div className='h-7 w-16 animate-pulse rounded bg-primary/15' />
      </div>
    </div>
  );
}
