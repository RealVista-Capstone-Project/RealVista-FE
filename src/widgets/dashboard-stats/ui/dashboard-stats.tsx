'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Rocket,
  DollarSign,
  LucideIcon,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { adminQueries } from '@/entities/admin/api';
import { cn, formatVND, formatNumber } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { ROUTES } from '@/shared/config/routes';
import { format } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  delay?: number;
  href?: string;
}

function StatCard({ title, value, icon: Icon, trend, description, delay = 0, href }: StatCardProps) {
  const content = (
    <>
      <div className='absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors' />

      <div className='relative flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <div className='p-4 bg-slate-50 rounded-2xl group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500'>
            <Icon className='h-6 w-6 text-slate-600 group-hover:text-primary transition-colors' />
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
              trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            )}>
              {trend.isPositive ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}
              {trend.value}
            </div>
          )}
        </div>

        <div>
          <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2'>
            {title}
          </p>
          <div className='flex items-end justify-between'>
            <h3 className='text-3xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors'>
              {value}
            </h3>
            {href && (
              <ChevronRight className='h-5 w-5 text-slate-300 group-hover:text-primary transition-all duration-500 transform group-hover:translate-x-1' />
            )}
          </div>
          {description && (
            <p className='mt-2 text-xs font-bold text-slate-500'>
              {description}
            </p>
          )}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className='block h-full'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay }}
          className='group relative h-full bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 overflow-hidden cursor-pointer'
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className='group relative h-full bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 overflow-hidden'
    >
      {content}
    </motion.div>
  );
}

function StatsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className='bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4'>
          <div className='flex justify-between items-center'>
            <Skeleton className='h-12 w-12 rounded-2xl' />
            <Skeleton className='h-6 w-16 rounded-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
      ))}
    </>
  );
}

export function DashboardStats({ days = 7 }: { days?: number }) {
  const t = useTranslations('AdminDashboard');

  const { startDate } = React.useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return {
      startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss")
    };
  }, [days]);

  const { data: overview, isLoading } = useQuery({
    ...adminQueries.overview(startDate),
    refetchInterval: 30000,
  });

  if (isLoading) return <StatsSkeleton />;

  return (
    <>
      <StatCard
        title={t('revenueInPeriod')}
        value={formatVND(Number(overview?.revenue_in_period ?? 0))}
        icon={DollarSign}
        description={t(`days${days}`)}
        delay={0}
      />

      <StatCard
        title={t('listingsCreated')}
        value={formatNumber(Number(overview?.listings_in_period ?? 0))}
        icon={Rocket}
        trend={{ value: t('new'), isPositive: true }}
        description={t(`days${days}`)}
        delay={0.1}
      />

      <StatCard
        title={t('newUsers')}
        value={formatNumber(Number(overview?.new_users_in_period ?? 0))}
        icon={Users}
        trend={{ value: t('active'), isPositive: true }}
        description={t(`days${days}`)}
        delay={0.2}
      />

      <StatCard
        title={t('unresolvedReports')}
        value={overview?.unresolved_reports ?? 0}
        icon={AlertOctagon}
        trend={{ value: t('highPriority'), isPositive: false }}
        description={t('requiresImmediateResolution')}
        delay={0.3}
        href={ROUTES.dashboard.manageReports}
      />
    </>
  );
}
