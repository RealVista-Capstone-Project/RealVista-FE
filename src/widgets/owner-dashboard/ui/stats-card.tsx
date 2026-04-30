'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

interface StatsCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: React.ReactNode;
  iconBg: string;
  isLoading?: boolean;
}

export function StatsCard({ title, value, trend, isPositive, icon, iconBg, isLoading }: StatsCardProps) {
  return (
    <div className='flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-muted-foreground'>{title}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', iconBg)}>
          {icon}
        </div>
      </div>
      <div className='flex items-end justify-between'>
        {isLoading ? (
          <Skeleton className='h-8 w-24' />
        ) : (
          <p className='text-2xl font-bold tracking-tight'>{value}</p>
        )}

        {isLoading ? (
          <Skeleton className='h-5 w-12 rounded-full' />
        ) : (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              isPositive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
            )}
          >
            {isPositive ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
