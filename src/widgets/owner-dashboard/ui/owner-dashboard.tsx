'use client';

import { useTranslations } from 'next-intl';
import { Eye, Building2, TrendingUp } from 'lucide-react';
import { StatsCard } from './stats-card';
import { PerformanceChart } from './performance-chart';
import { AgentContact } from './agent-contact';
import { SalesAnalytics } from './sales-analytics';
import { ScheduleCalendar } from './schedule-calendar';
import { ListingTable } from './listing-table';
import { useDashboardStats } from '../api';
import { CurrentPlanSubscription } from './current-plan-subscription';

import { useAuthSession } from '@/features/auth/model';

function formatViews(value?: number) {
  if (value === undefined) return '--';
  return value.toLocaleString();
}

function formatTrend(value?: number) {
  if (value === undefined) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function OwnerDashboard() {
  const t = useTranslations('OwnerDashboard');
  const { data: stats, isLoading } = useDashboardStats();
  const { data: session } = useAuthSession();

  const isOwner =
    session?.user?.role === 'owner' || (session?.user?.backendRoles ?? []).includes('OWNER');

  if (!isOwner) {
    return (
      <div className='flex h-full min-h-[50vh] items-center justify-center p-5 text-muted-foreground'>
        current not working
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 p-5 pb-10'>
      {/* ── Stats Row ── */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <StatsCard
          title={t('stats.totalViews')}
          value={formatViews(stats?.total_views)}
          trend={formatTrend(stats?.total_views_trend)}
          isPositive={(stats?.total_views_trend ?? 0) >= 0}
          iconBg='bg-emerald-100 dark:bg-emerald-500/20'
          icon={<Eye className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />}
          isLoading={isLoading}
        />
        <StatsCard
          title={t('stats.activeListing')}
          value={stats?.active_listing?.toLocaleString() ?? '--'}
          trend={formatTrend(stats?.active_listing_trend)}
          isPositive={(stats?.active_listing_trend ?? 0) >= 0}
          iconBg='bg-amber-100 dark:bg-amber-500/20'
          icon={<Building2 className='h-4 w-4 text-amber-600 dark:text-amber-400' />}
          isLoading={isLoading}
        />
        <StatsCard
          title={t('stats.totalClosed')}
          value={formatViews(stats?.total_closed)}
          trend={formatTrend(stats?.total_closed_trend)}
          isPositive={(stats?.total_closed_trend ?? 0) >= 0}
          iconBg='bg-rose-100 dark:bg-rose-500/20'
          icon={<TrendingUp className='h-4 w-4 text-rose-600 dark:text-rose-400' />}
          isLoading={isLoading}
          showTrend={false}
        />
      </div>

      {/* ── Main Grid ── */}
      <div className='grid grid-cols-1 gap-5 xl:grid-cols-3'>
        {/* Left: Performance Chart (2/3) */}
        <div className='xl:col-span-2 flex flex-col gap-5'>
          <PerformanceChart />

          {/* Sales + Leads row */}
          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            <SalesAnalytics />
            <AgentContact />
          </div>

          {/* Property Table */}
          <ListingTable />
        </div>

        {/* Right sidebar (1/3) */}
        <div className='flex flex-col gap-5'>
          <CurrentPlanSubscription />
          <ScheduleCalendar />
        </div>
      </div>
    </div>
  );
}
