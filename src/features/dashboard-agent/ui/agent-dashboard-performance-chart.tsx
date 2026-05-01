'use client';

import type { AgentPerformancePeriod, AgentPerformancePoint } from '../model/agent-dashboard.types';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipPayload,
  type TooltipValueType,
} from 'recharts';

const PERIODS = ['W', 'M', 'Y'] as const satisfies readonly AgentPerformancePeriod[];

function formatAxisTick(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

const VIEWS_COLOR = 'var(--chart-1)';
const INQUIRIES_COLOR = 'var(--chart-2)';

function formatTooltipValue(v: TooltipValueType | undefined) {
  if (v === undefined) return '';
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'number' ? x.toLocaleString() : String(x))).join(', ');
  return String(v);
}

function AgentPerformanceTooltip({
  active,
  payload,
  label,
  viewsLabel,
  inquiriesLabel,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  label?: string | number;
  viewsLabel: string;
  inquiriesLabel: string;
}) {
  if (!active || !payload?.length) return null;

  const views = payload.find((p) => String(p.dataKey) === 'views');
  const inquiries = payload.find((p) => String(p.dataKey) === 'inquiries');

  return (
    <div className='rounded-xl border bg-card px-3 py-2 shadow-lg'>
      {label != null && label !== '' ? (
        <p className='text-xs text-muted-foreground'>{String(label)}</p>
      ) : null}
      {views != null && views.value !== undefined ? (
        <p className='text-sm font-semibold' style={{ color: views.color ?? VIEWS_COLOR }}>
          {viewsLabel}: {formatTooltipValue(views.value)}
        </p>
      ) : null}
      {inquiries != null && inquiries.value !== undefined ? (
        <p className='text-sm font-semibold' style={{ color: inquiries.color ?? INQUIRIES_COLOR }}>
          {inquiriesLabel}: {formatTooltipValue(inquiries.value)}
        </p>
      ) : null}
    </div>
  );
}

export interface AgentDashboardPerformanceChartProps {
  trendData: readonly AgentPerformancePoint[];
  selectedPeriod: AgentPerformancePeriod;
  onPeriodChange: (period: AgentPerformancePeriod) => void;
}

export function AgentDashboardPerformanceChart({
  trendData,
  selectedPeriod,
  onPeriodChange,
}: AgentDashboardPerformanceChartProps) {
  const t = useTranslations('AgentDashboard');
  const rawId = useId().replace(/:/g, '');
  const gradientViewsId = `${rawId}-views`;
  const gradientInquiriesId = `${rawId}-inquiries`;

  return (
    <Card className='xl:col-span-2'>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <CardTitle>{t('sections.performance.title')}</CardTitle>
          <div className='flex items-center gap-1 rounded-xl border bg-muted/50 p-1'>
            {PERIODS.map((period) => (
              <button
                key={period}
                type='button'
                onClick={() => onPeriodChange(period)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                  selectedPeriod === period
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <CardDescription>{t('sections.performance.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-52'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientViewsId} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor={VIEWS_COLOR} stopOpacity={0.2} />
                  <stop offset='95%' stopColor={VIEWS_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={gradientInquiriesId} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor={INQUIRIES_COLOR} stopOpacity={0.2} />
                  <stop offset='95%' stopColor={INQUIRIES_COLOR} stopOpacity={0} />
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
                tickFormatter={(v) => formatAxisTick(Number(v))}
              />
              <Tooltip
                content={({ active, payload, label }) => (
                  <AgentPerformanceTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    viewsLabel={t('charts.views')}
                    inquiriesLabel={t('charts.inquiries')}
                  />
                )}
              />
              <Area
                type='monotone'
                dataKey='views'
                stroke={VIEWS_COLOR}
                strokeWidth={2.5}
                fill={`url(#${gradientViewsId})`}
                dot={false}
                activeDot={{ r: 5, fill: VIEWS_COLOR, strokeWidth: 2, stroke: '#fff' }}
              />
              <Area
                type='monotone'
                dataKey='inquiries'
                stroke={INQUIRIES_COLOR}
                strokeWidth={2.5}
                fill={`url(#${gradientInquiriesId})`}
                dot={false}
                activeDot={{ r: 5, fill: INQUIRIES_COLOR, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
