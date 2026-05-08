'use client';

import { useTranslations } from 'next-intl';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { useDashboardPerformance } from '../api';
import { Skeleton } from '@/shared/ui/skeleton';

const TooltipBody = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className='rounded-xl border bg-card px-3 py-2 shadow-lg'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='text-sm font-semibold'>{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export function OwnerDailyViewsChart() {
  const t = useTranslations('OwnerDashboard.dailyViews');
  const { data: performance, isLoading } = useDashboardPerformance('W', 'visit');

  const chartData =
    performance?.data?.map((p) => ({
      label: p.label,
      value: typeof p.value === 'number' ? p.value : Number(p.value),
    })) ?? [];

  const total = chartData.reduce((s, d) => s + d.value, 0);
  const maxVal = Math.max(1, ...chartData.map((d) => d.value));

  return (
    <div className='flex min-h-[240px] flex-col gap-4 rounded-[24px] border border-sky-200/60 bg-card p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-border dark:shadow-none'>
      <div className='flex shrink-0 items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15'>
            <LineChartIcon className='h-4 w-4 text-amber-600 dark:text-amber-400' />
          </div>
          <div>
            <h3 className='text-base font-semibold'>{t('title')}</h3>
            <p className='text-xs text-muted-foreground'>{t('subtitle')}</p>
          </div>
        </div>
        <div className='flex flex-col items-end gap-0.5'>
          <p className='text-xs text-muted-foreground'>{t('weekTotal')}</p>
          {isLoading ? (
            <Skeleton className='h-7 w-16' />
          ) : (
            <p className='text-2xl font-bold tracking-tight'>{total.toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className='w-full shrink-0'>
        {isLoading ? (
          <Skeleton className='h-[140px] w-full rounded-xl' />
        ) : (
          <ResponsiveContainer width='100%' height={140}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                domain={[0, maxVal]}
              />
              <Tooltip content={<TooltipBody />} />
              <Line
                type='monotone'
                dataKey='value'
                stroke='#eab308'
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#eab308' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#eab308' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
