'use client';

import { useTranslations } from 'next-intl';
import { DollarSign, Building2, CheckCircle2 } from 'lucide-react';
import { StatsCard } from './stats-card';
import { PerformanceChart } from './performance-chart';
import { AgentContact } from './agent-contact';
import { SalesAnalytics } from './sales-analytics';
import { PropertyOverview } from './property-overview';
import { ScheduleCalendar } from './schedule-calendar';
import { ListingTable } from './listing-table';
import { useDashboardStats } from '../api';
import { formatVND } from '@/shared/lib/utils';

function formatCompactCurrency(value?: number) {
  if (value === undefined) return '--';
  return formatVND(value);
}

function formatTrend(value?: number) {
  if (value === undefined) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function OwnerDashboard() {
  const t = useTranslations('OwnerDashboard');
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className='flex flex-col gap-6 p-5 pb-10'>
      {/* ── Stats Row ── */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <StatsCard
          title={t('stats.totalRevenue')}
          value={formatCompactCurrency(stats?.totalRevenue)}
          trend={formatTrend(stats?.totalRevenueTrend)}
          isPositive={(stats?.totalRevenueTrend ?? 0) >= 0}
          iconBg='bg-emerald-100 dark:bg-emerald-500/20'
          icon={<DollarSign className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />}
          isLoading={isLoading}
        />
        <StatsCard
          title={t('stats.activeListing')}
          value={stats?.activeListing?.toLocaleString() ?? '--'}
          trend={formatTrend(stats?.activeListingTrend)}
          isPositive={(stats?.activeListingTrend ?? 0) >= 0}
          iconBg='bg-amber-100 dark:bg-amber-500/20'
          icon={<Building2 className='h-4 w-4 text-amber-600 dark:text-amber-400' />}
          isLoading={isLoading}
        />
        <StatsCard
          title={t('stats.totalClosed')}
          value={stats?.totalClosed?.toLocaleString() ?? '--'}
          trend={formatTrend(stats?.totalClosedTrend)}
          isPositive={(stats?.totalClosedTrend ?? 0) >= 0}
          iconBg='bg-rose-100 dark:bg-rose-500/20'
          icon={<CheckCircle2 className='h-4 w-4 text-rose-600 dark:text-rose-400' />}
          isLoading={isLoading}
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
          <ScheduleCalendar />
          <PropertyOverview />
        </div>
      </div>
    </div>
  );
}
