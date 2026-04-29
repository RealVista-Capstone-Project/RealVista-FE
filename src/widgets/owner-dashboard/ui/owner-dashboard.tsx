'use client';

import { useTranslations } from 'next-intl';
import {
  Users,
  DollarSign,
  Building2,
  CheckCircle2,
  Bell,
  Plus,
  TrendingUp,
  List,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StatsCard } from './stats-card';
import { PerformanceChart } from './performance-chart';
import { ReminderCard } from './reminder-card';
import { LeadsContact } from './leads-contact';
import { SalesAnalytics } from './sales-analytics';
import { PropertyOverview } from './property-overview';
import { ScheduleCalendar } from './schedule-calendar';
import { PropertyTable } from './property-table';

export function OwnerDashboard() {
  const t = useTranslations('OwnerDashboard');

  return (
    <div className='flex flex-col gap-6 p-5 pb-10'>
      {/* ── Stats Row ── */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatsCard
          title={t('stats.totalRevenue')}
          value='$96.7M'
          trend='+12%'
          isPositive={true}
          iconBg='bg-emerald-100 dark:bg-emerald-500/20'
          icon={<DollarSign className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />}
        />
        <StatsCard
          title={t('stats.activeListing')}
          value='23'
          trend='-12%'
          isPositive={false}
          iconBg='bg-amber-100 dark:bg-amber-500/20'
          icon={<Building2 className='h-4 w-4 text-amber-600 dark:text-amber-400' />}
        />
        <StatsCard
          title={t('stats.totalClosed')}
          value='42'
          trend='+12%'
          isPositive={true}
          iconBg='bg-rose-100 dark:bg-rose-500/20'
          icon={<CheckCircle2 className='h-4 w-4 text-rose-600 dark:text-rose-400' />}
        />
      </div>

      {/* ── Deal Pipeline Banner ── */}

      {/* ── Main Grid ── */}
      <div className='grid grid-cols-1 gap-5 xl:grid-cols-3'>
        {/* Left: Performance Chart (2/3) */}
        <div className='xl:col-span-2 flex flex-col gap-5'>
          <PerformanceChart />

          {/* Sales + Leads row */}
          <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
            <SalesAnalytics />
            <LeadsContact />
          </div>

          {/* Property Table */}
          <PropertyTable />
        </div>

        {/* Right sidebar (1/3) */}
        <div className='flex flex-col gap-5'>
          <ReminderCard />
          <ScheduleCalendar />
          <PropertyOverview />
        </div>
      </div>
    </div>
  );
}
