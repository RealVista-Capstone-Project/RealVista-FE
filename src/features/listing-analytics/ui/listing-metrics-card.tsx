'use client';

import * as React from 'react';
import { Eye, Users, Calendar, TrendingUp, CircleHelp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip';
import { useListingAnalytics } from '../api/use-listing-analytics';

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
      <div className='rounded-lg border border-purple-92 p-6'>
        <h2 className='mb-6 text-xl font-bold leading-[1.6] tracking-[-0.1px] text-main-black'>
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
    <div className='rounded-lg border border-purple-92 p-6'>
      <h2 className='mb-6 text-xl font-bold leading-[1.6] tracking-[-0.1px] text-main-black'>
        {t('title')}
      </h2>

      <div className='grid grid-cols-2 gap-6 sm:grid-cols-4'>
        <MetricItem
          icon={<Eye className='h-6 w-6' strokeWidth={2} />}
          label={t('metrics.totalViews')}
          value={analytics.total_views.toLocaleString()}
        />
        <MetricItem
          icon={<Users className='h-6 w-6' strokeWidth={2} />}
          label={t('metrics.uniqueViewers')}
          value={analytics.unique_viewers.toLocaleString()}
        />
        <MetricItem
          icon={<Calendar className='h-6 w-6' strokeWidth={2} />}
          label={t('metrics.tourBookings')}
          value={analytics.tour_bookings.toLocaleString()}
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
        <p className='text-base font-medium leading-[1.5] text-grey-500'>{label}</p>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleHelp className='h-4 w-4 cursor-help text-grey-500/60 transition-colors hover:text-grey-500' />
            </TooltipTrigger>
            <TooltipContent side='top' align='start'>
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <div className='text-main-black/50'>{icon}</div>
        <p className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='h-6 w-24 animate-pulse rounded bg-purple-92' />
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 animate-pulse rounded bg-purple-92' />
        <div className='h-7 w-16 animate-pulse rounded bg-purple-92' />
      </div>
    </div>
  );
}
