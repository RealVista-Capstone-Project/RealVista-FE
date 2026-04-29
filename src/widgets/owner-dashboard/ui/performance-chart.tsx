'use client';

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
import { cn } from '@/shared/lib/utils';

const revenueData = [
  { month: 'Jan', revenue: 420000, visits: 320 },
  { month: 'Feb', revenue: 580000, visits: 480 },
  { month: 'Mar', revenue: 510000, visits: 410 },
  { month: 'Apr', revenue: 720000, visits: 590 },
  { month: 'May', revenue: 680000, visits: 540 },
  { month: 'Jun', revenue: 890000, visits: 720 },
  { month: 'Jul', revenue: 830000, visits: 670 },
  { month: 'Aug', revenue: 960000, visits: 810 },
  { month: 'Sep', revenue: 740000, visits: 620 },
  { month: 'Oct', revenue: 1050000, visits: 880 },
  { month: 'Nov', revenue: 980000, visits: 840 },
  { month: 'Dec', revenue: 1200000, visits: 960 },
];

type ViewMode = 'W' | 'M' | 'Y';
type MetricType = 'Revenue' | 'Visit';

function formatRevenue(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  metric: MetricType;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-xl border bg-card px-3 py-2 shadow-lg'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='text-sm font-semibold'>
          {metric === 'Revenue' ? formatRevenue(payload[0].value) : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function PerformanceChart() {
  const [metric, setMetric] = useState<MetricType>('Revenue');
  const [view, setView] = useState<ViewMode>('Y');

  const dataKey = metric === 'Revenue' ? 'revenue' : 'visits';
  const color = metric === 'Revenue' ? '#6366f1' : '#22c55e';

  const slicedData =
    view === 'W'
      ? revenueData.slice(-7)
      : view === 'M'
        ? revenueData.slice(-4)
        : revenueData;

  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <h3 className='text-base font-semibold'>Performance</h3>
        <div className='flex items-center gap-3'>
          {/* Metric Toggle */}
          <div className='flex items-center gap-1 rounded-xl border bg-muted/50 p-1'>
            {(['Revenue', 'Visit'] as MetricType[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                  metric === m
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m}
              </button>
            ))}
          </div>
          {/* View Toggle */}
          <div className='flex items-center gap-1 rounded-xl border bg-muted/50 p-1'>
            {(['W', 'M', 'Y'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                  view === v
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className='h-52'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={slicedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id='colorGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor={color} stopOpacity={0.2} />
                <stop offset='95%' stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={metric === 'Revenue' ? (v) => formatRevenue(v) : undefined}
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Area
              type='monotone'
              dataKey={dataKey}
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
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20'>
            <span className='text-lg'>🏡</span>
          </div>
          <div>
            <p className='text-sm font-semibold'>The Somerset</p>
            <p className='text-xs text-muted-foreground'>House</p>
          </div>
        </div>
        <div className='flex gap-4 text-center'>
          {[
            { label: 'Sold', value: '175' },
            { label: 'Rented', value: '125' },
            { label: 'Views', value: '2K+' },
          ].map((item) => (
            <div key={item.label}>
              <p className='text-sm font-bold'>{item.value}</p>
              <p className='text-xs text-muted-foreground'>{item.label}</p>
            </div>
          ))}
        </div>
        <div className='hidden flex-col gap-1 sm:flex'>
          <p className='text-xs text-muted-foreground'>Recommended to 14 Leads</p>
          <div className='flex items-center gap-1'>
            <span className='h-2 w-2 rounded-full bg-emerald-500' />
            <p className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
              42 Closed Deals
            </p>
          </div>
        </div>
        <div className='rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'>
          On Progress
        </div>
      </div>
    </div>
  );
}
