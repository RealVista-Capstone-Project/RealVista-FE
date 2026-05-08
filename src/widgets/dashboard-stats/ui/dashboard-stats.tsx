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
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

import { adminQueries } from '@/entities/admin/api';
import { cn, formatVND, formatNumber } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { ROUTES } from '@/shared/config/routes';
import { format } from 'date-fns';

type AccentColor = 'emerald' | 'violet' | 'sky' | 'rose';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: AccentColor;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  delay?: number;
  href?: string;
}

const accentConfig: Record<AccentColor, { bg: string; icon: string; ring: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    ring: 'ring-emerald-100',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    ring: 'ring-violet-100',
  },
  sky: {
    bg: 'bg-sky-50',
    icon: 'text-sky-600',
    ring: 'ring-sky-100',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-600',
    ring: 'ring-rose-100',
  },
};

function StatCard({
  title,
  value,
  icon: Icon,
  accent = 'sky',
  trend,
  description,
  href,
}: StatCardProps) {
  const { bg, icon: iconColor, ring } = accentConfig[accent];

  const inner = (
    <div className='flex h-full flex-col justify-between gap-4'>
      {/* Top row: icon + trend */}
      <div className='flex items-start justify-between'>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-4', bg, ring)}>
          <Icon className={cn('h-5 w-5', iconColor)} strokeWidth={2} />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className='h-3 w-3' strokeWidth={2.5} />
            ) : (
              <TrendingDown className='h-3 w-3' strokeWidth={2.5} />
            )}
            {trend.value}
          </div>
        )}
      </div>

      {/* Bottom: value + label */}
      <div className='flex flex-col gap-0.5'>
        <span className='text-2xl font-bold tracking-tight text-slate-900'>{value}</span>
        <span className='text-sm font-medium text-slate-500'>{title}</span>
        {description && (
          <span className='mt-1 text-xs text-slate-400'>{description}</span>
        )}
      </div>

      {href && (
        <div className='flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100'>
          Xem chi tiết
          <ArrowRight className='h-3.5 w-3.5' strokeWidth={2.5} />
        </div>
      )}
    </div>
  );

  const baseClass =
    'group relative h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-200';

  if (href) {
    return (
      <Link href={href} className='block h-full'>
        <div className={baseClass}>{inner}</div>
      </Link>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}

function StatsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className='rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4'
        >
          <div className='flex justify-between items-start'>
            <Skeleton className='h-10 w-10 rounded-xl' />
            <Skeleton className='h-6 w-16 rounded-full' />
          </div>
          <div className='space-y-1.5'>
            <Skeleton className='h-7 w-28' />
            <Skeleton className='h-4 w-20' />
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
      startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
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
        accent='emerald'
        description={t(`days${days}`)}
      />

      <StatCard
        title={t('listingsCreated')}
        value={formatNumber(Number(overview?.listings_in_period ?? 0))}
        icon={Rocket}
        accent='violet'
        trend={{ value: t('new'), isPositive: true }}
        description={t(`days${days}`)}
      />

      <StatCard
        title={t('newUsers')}
        value={formatNumber(Number(overview?.new_users_in_period ?? 0))}
        icon={Users}
        accent='sky'
        trend={{ value: t('active'), isPositive: true }}
        description={t(`days${days}`)}
      />

      <StatCard
        title={t('unresolvedReports')}
        value={overview?.unresolved_reports ?? 0}
        icon={AlertOctagon}
        accent='rose'
        trend={{ value: t('highPriority'), isPositive: false }}
        description={t('requiresImmediateResolution')}
        href={ROUTES.dashboard.manageReports}
      />
    </>
  );
}
