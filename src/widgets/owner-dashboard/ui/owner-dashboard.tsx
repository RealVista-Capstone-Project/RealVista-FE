'use client';

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
  return (
    <div className='flex flex-col gap-6 pb-10'>
      {/* ── Top bar ── */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Owner Dashboard</h1>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            Welcome back,{' '}
            <span className='font-semibold text-foreground'>Toby Belhome</span> 👋
          </p>
        </div>

        <div className='flex items-center gap-3'>
          {/* Notification */}
          <button className='relative flex h-9 w-9 items-center justify-center rounded-xl border bg-card shadow-sm hover:bg-muted transition-colors'>
            <Bell className='h-4 w-4' />
            <span className='absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-background' />
          </button>

          {/* Add listing CTA */}
          <button className='hidden sm:flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors'>
            <Plus className='h-4 w-4' />
            Add Listing
          </button>

          {/* Avatar */}
          <Avatar className='h-9 w-9 border-2 border-primary/20'>
            <AvatarImage src='' alt='Toby' />
            <AvatarFallback className='bg-primary/10 text-primary font-bold text-sm'>
              TB
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatsCard
          title='Active Leads'
          value='120'
          trend='+12%'
          isPositive={true}
          iconBg='bg-indigo-100 dark:bg-indigo-500/20'
          icon={<Users className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />}
        />
        <StatsCard
          title='Total Revenue'
          value='$96.7M'
          trend='+12%'
          isPositive={true}
          iconBg='bg-emerald-100 dark:bg-emerald-500/20'
          icon={<DollarSign className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />}
        />
        <StatsCard
          title='Active Listing'
          value='23'
          trend='-12%'
          isPositive={false}
          iconBg='bg-amber-100 dark:bg-amber-500/20'
          icon={<Building2 className='h-4 w-4 text-amber-600 dark:text-amber-400' />}
        />
        <StatsCard
          title='Total Closed'
          value='42'
          trend='+12%'
          isPositive={true}
          iconBg='bg-rose-100 dark:bg-rose-500/20'
          icon={<CheckCircle2 className='h-4 w-4 text-rose-600 dark:text-rose-400' />}
        />
      </div>

      {/* ── Deal Pipeline Banner ── */}
      <div className='flex flex-wrap items-center gap-4 rounded-2xl border bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent p-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20'>
            <TrendingUp className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
          </div>
          <div>
            <p className='text-sm font-semibold'>Deal Pipeline</p>
            <p className='text-xs text-muted-foreground'>On Progress</p>
          </div>
        </div>
        <div className='flex flex-wrap gap-6'>
          {[
            { label: 'Active Leads', value: '120', color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'On Progress', value: '132', color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Closed Deals', value: '42', color: 'text-emerald-600 dark:text-emerald-400' },
          ].map((item) => (
            <div key={item.label} className='flex flex-col'>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className='text-xs text-muted-foreground'>{item.label}</p>
            </div>
          ))}
        </div>
        <div className='ml-auto'>
          <button className='flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shadow-sm'>
            <List className='h-3.5 w-3.5' />
            View Pipeline
          </button>
        </div>
      </div>

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
