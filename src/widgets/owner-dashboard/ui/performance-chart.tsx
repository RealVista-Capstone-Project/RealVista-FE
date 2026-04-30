'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn, formatVND } from '@/shared/lib/utils';
import { useDashboardPerformance, useFeaturedProperty } from '../api';
import type { PerformanceMetric, PerformancePeriod } from '../api';

function formatViews(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  isRevenue,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  isRevenue: boolean;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-xl border bg-card px-3 py-2 shadow-lg'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='text-sm font-semibold'>
          {isRevenue ? formatVND(payload[0].value) : formatViews(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function PerformanceChart() {
  const t = useTranslations('OwnerDashboard.performance');
  const [metricKey, setMetricKey] = useState<PerformanceMetric>('revenue');
  const [view, setView] = useState<PerformancePeriod>('M');

  const { data: performance } = useDashboardPerformance(view, metricKey);
  const { data: featured } = useFeaturedProperty();

  const isRevenue = metricKey === 'revenue';
  const color = isRevenue ? '#6366f1' : '#22c55e';

  const chartData = performance?.data ?? [];

  const metrics: { key: PerformanceMetric; label: string }[] = [
    // { key: 'revenue', label: t('revenue') },
    { key: 'visit', label: t('visit') },
  ];

  const views: { key: PerformancePeriod; label: string }[] = [
    { key: 'W', label: t('week') },
    { key: 'M', label: t('month') },
    { key: 'Y', label: t('year') },
  ];

  const featuredStatusLabel =
    featured?.status === 'SOLD'
      ? t('sold')
      : featured?.status === 'RENTED'
        ? t('rented')
        : t('onProgress');

  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <h3 className='text-base font-semibold'>{t('title')}</h3>
        <div className='flex items-center gap-3'>
          {/* Metric Toggle */}
          <div className='flex items-center gap-1 rounded-xl border bg-muted/50 p-1'>
            {metrics.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetricKey(m.key)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                  metricKey === m.key
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          {/* View Toggle */}
          <div className='flex items-center gap-1 rounded-xl border bg-muted/50 p-1'>
            {views.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                  view === v.key
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className='h-52'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id='colorGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor={color} stopOpacity={0.2} />
                <stop offset='95%' stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v) => (isRevenue ? formatVND(v) : formatViews(v))}
            />
            <Tooltip content={<CustomTooltip isRevenue={isRevenue} />} />
            <Area
              type='monotone'
              dataKey='value'
              stroke={color}
              strokeWidth={2.5}
              fill='url(#colorGradient)'
              dot={false}
              activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Featured Property */}
      <div className='mt-1 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3'>
        <div className='flex items-center gap-3'>
          <div className='h-10 w-10 overflow-hidden rounded-xl bg-indigo-100 dark:bg-indigo-500/20'>
            {featured?.image_url ? (
              <img
                src={featured.image_url}
                alt={featured?.name ?? t('featuredProperty')}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center'>
                <span className='text-lg'>🏡</span>
              </div>
            )}
          </div>
          <div>
            <p className='text-sm font-semibold'>{featured?.name ?? t('featuredProperty')}</p>
            <p className='text-xs text-muted-foreground'>{featured?.type ?? t('featuredType')}</p>
          </div>
        </div>
        <div className='flex gap-4 text-center'>
          {[
            { label: t('sold'), value: featured?.sold?.toLocaleString() ?? '--' },
            { label: t('rented'), value: featured?.rented?.toLocaleString() ?? '--' },
            { label: t('views'), value: featured?.views ? formatViews(featured.views) : '--' },
          ].map((item) => (
            <div key={item.label}>
              <p className='text-sm font-bold'>{item.value}</p>
              <p className='text-xs text-muted-foreground'>{item.label}</p>
            </div>
          ))}
        </div>

        <div className='rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'>
          {featuredStatusLabel}
        </div>
      </div>
    </div>
  );
}
