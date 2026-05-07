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
const PERIOD_LABELS_VI: Record<AgentPerformancePeriod, string> = {
  W: 'Tuần',
  M: 'Tháng',
  Y: 'Năm',
};

const MONTH_LABELS_VI: Record<string, string> = {
  jan: 'Th1',
  january: 'Th1',
  feb: 'Th2',
  february: 'Th2',
  mar: 'Th3',
  march: 'Th3',
  apr: 'Th4',
  april: 'Th4',
  may: 'Th5',
  jun: 'Th6',
  june: 'Th6',
  jul: 'Th7',
  july: 'Th7',
  aug: 'Th8',
  august: 'Th8',
  sep: 'Th9',
  sept: 'Th9',
  september: 'Th9',
  oct: 'Th10',
  october: 'Th10',
  nov: 'Th11',
  november: 'Th11',
  dec: 'Th12',
  december: 'Th12',
};

const WEEKDAY_LABELS_VI: Record<string, string> = {
  mon: 'T2',
  monday: 'T2',
  tue: 'T3',
  tues: 'T3',
  tuesday: 'T3',
  wed: 'T4',
  wednesday: 'T4',
  thu: 'T5',
  thur: 'T5',
  thurs: 'T5',
  thursday: 'T5',
  fri: 'T6',
  friday: 'T6',
  sat: 'T7',
  saturday: 'T7',
  sun: 'CN',
  sunday: 'CN',
};

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

function formatPeriodLabelVi(value: string | number, period: AgentPerformancePeriod): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  // Normalize week-index labels (e.g. W1, w2, Week 3) to Vietnamese.
  const weekMatch = raw.match(/^(?:w|week)\s*[-_]?(\d{1,2})$/i);
  if (weekMatch?.[1]) {
    return `Tuần ${weekMatch[1]}`;
  }

  // If backend sends parseable date strings, format directly in Vietnamese.
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    if (period === 'W') {
      return parsed.toLocaleDateString('vi-VN', { weekday: 'short' });
    }
    if (period === 'M') {
      return parsed.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
    return parsed.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
  }

  const normalized = raw.toLowerCase().replace(/\./g, '');
  if (period === 'Y') {
    return MONTH_LABELS_VI[normalized] ?? raw;
  }
  if (period === 'W') {
    return WEEKDAY_LABELS_VI[normalized] ?? raw;
  }
  return raw;
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
    <div className='rounded-xl border bg-white px-3 py-2 shadow-lg dark:bg-card'>
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

export interface AgentDashboardPerformanceChartContentProps extends AgentDashboardPerformanceChartProps {
  /** `standalone` uses CardHeader/CardContent for use inside a wrapping Card; `embedded` uses plain divs for nesting inside another card. */
  variant?: 'standalone' | 'embedded';
}

export function AgentDashboardPerformanceChartContent({
  trendData,
  selectedPeriod,
  onPeriodChange,
  variant = 'embedded',
}: AgentDashboardPerformanceChartContentProps) {
  const t = useTranslations('AgentDashboard');
  const rawId = useId().replace(/:/g, '');
  const gradientViewsId = `${rawId}-views`;
  const gradientInquiriesId = `${rawId}-inquiries`;

  const headerBlock = (
    <>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <CardTitle>{t('sections.performance.title')}</CardTitle>
        <div className='flex items-center gap-1 rounded-xl border border-border/70 bg-white p-1 dark:bg-muted/50'>
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
                  {PERIOD_LABELS_VI[period]}
            </button>
          ))}
        </div>
      </div>
      <CardDescription>{t('sections.performance.description')}</CardDescription>
    </>
  );

  const chartBlock = (
    <div className='min-h-[220px] h-52 sm:h-56'>
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
            tickFormatter={(value) => formatPeriodLabelVi(value, selectedPeriod)}
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
                label={label != null ? formatPeriodLabelVi(label, selectedPeriod) : label}
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
  );

  if (variant === 'standalone') {
    return (
      <>
        <CardHeader>{headerBlock}</CardHeader>
        <CardContent>{chartBlock}</CardContent>
      </>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-1.5'>{headerBlock}</div>
      {chartBlock}
    </div>
  );
}

export function AgentDashboardPerformanceChart(props: AgentDashboardPerformanceChartProps) {
  return (
    <Card className='border-border/70 bg-white shadow-sm dark:bg-card xl:col-span-8'>
      <AgentDashboardPerformanceChartContent {...props} variant='standalone' />
    </Card>
  );
}
