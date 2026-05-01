'use client';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart';
import { Skeleton } from '@/shared/ui/skeleton';
import type { AgentDateRange, AgentPerformancePeriod } from '../model/agent-dashboard.types';
import {
  useAgentAppointmentsSnapshot,
  useAgentDashboardMetrics,
  useAgentPerformanceMetrics,
  useAgentPlanSnapshot,
} from '../api/use-agent-dashboard';
import {
  Building2,
  CalendarDays,
  CircleAlert,
  Home,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { memo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';

const AgentDashboardPerformanceChart = dynamic(
  () =>
    import('./agent-dashboard-performance-chart').then((m) => ({
      default: m.AgentDashboardPerformanceChart,
    })),
  {
    loading: () => (
      <Card className='xl:col-span-8'>
        <CardHeader>
          <Skeleton className='h-6 w-48 max-w-full' />
          <Skeleton className='mt-2 h-4 w-full max-w-lg' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-52 w-full' />
        </CardContent>
      </Card>
    ),
  }
);

const AgentDashboardAppointmentsCard = dynamic(
  () =>
    import('./agent-dashboard-appointments-card').then((m) => ({
      default: m.AgentDashboardAppointmentsCard,
    })),
  {
    loading: () => (
      <Card className='xl:col-span-2'>
        <CardHeader>
          <Skeleton className='h-6 w-48 max-w-full' />
          <Skeleton className='mt-2 h-4 w-72 max-w-full' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-80 w-full' />
        </CardContent>
      </Card>
    ),
  }
);

const AgentDashboardPlanCard = dynamic(
  () =>
    import('./agent-dashboard-plan-card').then((m) => ({
      default: m.AgentDashboardPlanCard,
    })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48 max-w-full' />
          <Skeleton className='mt-2 h-4 w-full max-w-md' />
        </CardHeader>
        <CardContent className='space-y-3'>
          <Skeleton className='h-36 w-full rounded-xl' />
        </CardContent>
      </Card>
    ),
  }
);

const AgentDashboardTopListingsCard = dynamic(
  () =>
    import('./agent-dashboard-top-listings-card').then((m) => ({
      default: m.AgentDashboardTopListingsCard,
    })),
  {
    loading: () => (
      <Card className='border-border/70 bg-card shadow-sm'>
        <CardHeader>
          <Skeleton className='h-6 w-56 max-w-full' />
          <Skeleton className='mt-2 h-4 w-full max-w-lg' />
        </CardHeader>
        <CardContent className='space-y-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='flex gap-3'>
              <Skeleton className='h-8 w-8 shrink-0 rounded-full' />
              <Skeleton className='h-12 w-12 shrink-0 rounded-lg' />
              <div className='min-w-0 flex-1 space-y-2'>
                <Skeleton className='h-4 w-2/3' />
                <Skeleton className='h-2 w-full' />
                <Skeleton className='h-3 w-4/5' />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    ),
  }
);

/** Keep status order stable so chart slices/legend don't jump between renders. */
const LEAD_STATUS_ORDER = [
  'new',
  'consulting',
  'tour_scheduled',
  'toured',
  'negotiating',
  'closed',
  'not_potential',
] as const;

const STATUS_DOT_STYLES: Record<(typeof LEAD_STATUS_ORDER)[number], { background: string }> = {
  new: { background: 'var(--primary)' },
  consulting: { background: 'var(--chart-2)' },
  tour_scheduled: { background: 'var(--chart-3)' },
  toured: { background: 'var(--chart-4)' },
  negotiating: { background: 'var(--chart-5)' },
  closed: { background: 'var(--chart-1)' },
  not_potential: { background: 'var(--muted-foreground)' },
};

function toInputDateValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildTrend(currentValue: number, previousValue: number) {
  if (previousValue <= 0) {
    return {
      trend: currentValue >= 0 ? ('up' as const) : ('down' as const),
      deltaPercent: currentValue > 0 ? 100 : 0,
    };
  }
  const deltaPercent = ((currentValue - previousValue) / previousValue) * 100;
  return {
    trend: deltaPercent >= 0 ? ('up' as const) : ('down' as const),
    deltaPercent: Math.round(Math.abs(deltaPercent)),
  };
}

function toDateRangeLabel(range: AgentDateRange, locale: string) {
  const from = new Date(`${range.from}T00:00:00`);
  const to = new Date(`${range.to}T00:00:00`);
  const formatConfig: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return `${from.toLocaleDateString(locale, formatConfig)} - ${to.toLocaleDateString(locale, formatConfig)}`;
}

function buildRangeByDays(days: number): AgentDateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return {
    from: toInputDateValue(from),
    to: toInputDateValue(to),
  };
}

function buildThisMonthRange(): AgentDateRange {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: toInputDateValue(firstDay),
    to: toInputDateValue(now),
  };
}

function AgentPerformanceChartSection() {
  const [selectedPeriod, setSelectedPeriod] = useState<AgentPerformancePeriod>('M');
  const performanceQuery = useAgentPerformanceMetrics(selectedPeriod);
  const trendData = performanceQuery.data?.data.trend ?? [];
  return (
    <AgentDashboardPerformanceChart
      trendData={trendData}
      selectedPeriod={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
    />
  );
}

const AgentLeadChannelsCard = memo(function AgentLeadChannelsCard() {
  const t = useTranslations('AgentDashboard');
  const locale = useLocale();
  const [activePreset, setActivePreset] = useState<'7D' | '30D' | '90D' | 'THIS_MONTH' | 'CUSTOM'>(
    '30D'
  );
  const [activeRange, setActiveRange] = useState<AgentDateRange>(() => buildRangeByDays(30));
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(activeRange.from);
  const [customTo, setCustomTo] = useState(activeRange.to);
  const metricsQuery = useAgentDashboardMetrics(activeRange);

  const channelChartConfig = {
    new: { label: t('charts.status.new'), color: 'var(--primary)' },
    consulting: { label: t('charts.status.consulting'), color: 'var(--chart-2)' },
    tour_scheduled: { label: t('charts.status.tour_scheduled'), color: 'var(--chart-3)' },
    toured: { label: t('charts.status.toured'), color: 'var(--chart-4)' },
    negotiating: { label: t('charts.status.negotiating'), color: 'var(--chart-5)' },
    closed: { label: t('charts.status.closed'), color: 'var(--chart-1)' },
    not_potential: { label: t('charts.status.not_potential'), color: 'var(--muted-foreground)' },
  } satisfies ChartConfig;

  const leadStatusLabel = {
    new: t('charts.status.new'),
    consulting: t('charts.status.consulting'),
    tour_scheduled: t('charts.status.tour_scheduled'),
    toured: t('charts.status.toured'),
    negotiating: t('charts.status.negotiating'),
    closed: t('charts.status.closed'),
    not_potential: t('charts.status.not_potential'),
  } as const;

  const statusCountMap = new Map(
    (metricsQuery.data?.data.crmStatusSummary.byStatus ?? []).map((item) => [
      item.status.toLowerCase(),
      Number(item.count ?? 0),
    ])
  );
  const channelData = LEAD_STATUS_ORDER.map((status) => ({
    channel: status,
    leads: statusCountMap.get(status) ?? 0,
  }));
  const totalChannelLeads = channelData.reduce((sum, row) => sum + Number(row.leads ?? 0), 0);
  const nonZeroChannelData = channelData.filter((row) => Number(row.leads ?? 0) > 0);
  const maxLeadCount = Math.max(...channelData.map((row) => Number(row.leads ?? 0)), 0);
  const minLeadCount = Math.min(
    ...nonZeroChannelData.map((row) => Number(row.leads ?? 0)),
    maxLeadCount
  );
  const spreadRatio = maxLeadCount > 0 ? (maxLeadCount - minLeadCount) / maxLeadCount : 0;
  const useBarChart = nonZeroChannelData.length >= 5 || spreadRatio < 0.45;
  const channelPieData = channelData.map((row) => ({
    ...row,
    channel: row.channel,
    leads: Number(row.leads ?? 0),
    fill: `var(--color-${row.channel})`,
  }));

  const presetButtons: Array<{ key: '7D' | '30D' | '90D' | 'THIS_MONTH'; label: string }> = [
    { key: '7D', label: t('timebound.presets.7d') },
    { key: '30D', label: t('timebound.presets.30d') },
    { key: '90D', label: t('timebound.presets.90d') },
    { key: 'THIS_MONTH', label: t('timebound.presets.thisMonth') },
  ];

  const applyPreset = (preset: '7D' | '30D' | '90D' | 'THIS_MONTH') => {
    const nextRange =
      preset === '7D'
        ? buildRangeByDays(7)
        : preset === '30D'
          ? buildRangeByDays(30)
          : preset === '90D'
            ? buildRangeByDays(90)
            : buildThisMonthRange();
    setActivePreset(preset);
    setActiveRange(nextRange);
    setCustomFrom(nextRange.from);
    setCustomTo(nextRange.to);
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    if (new Date(`${customFrom}T00:00:00`).getTime() > new Date(`${customTo}T00:00:00`).getTime())
      return;
    setActiveRange({ from: customFrom, to: customTo });
    setActivePreset('CUSTOM');
    setCustomOpen(false);
  };

  return (
    <Card className='border-border/70 bg-card shadow-sm xl:col-span-4'>
      <CardHeader className='space-y-4'>
        <div className='space-y-1'>
          <CardTitle>{t('sections.channels.title')}</CardTitle>
          <CardDescription>{t('sections.channels.description')}</CardDescription>
        </div>
        <div className='space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3'>
          <div className='flex flex-wrap items-center gap-2'>
            {presetButtons.map((preset) => (
              <Button
                key={preset.key}
                type='button'
                size='sm'
                variant='ghost'
                className={cn(
                  'h-8 rounded-lg border px-3 text-xs font-medium',
                  activePreset === preset.key
                    ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15'
                    : 'border-border/70 bg-background text-muted-foreground hover:text-foreground'
                )}
                onClick={() => applyPreset(preset.key)}
              >
                {preset.label}
              </Button>
            ))}
            <Button
              type='button'
              size='sm'
              variant='outline'
              className={cn(
                'ml-auto h-8 rounded-lg border-border/70 px-3 text-xs',
                customOpen && 'border-primary/60 text-primary'
              )}
              onClick={() => setCustomOpen((prev) => !prev)}
            >
              <CalendarDays className='mr-1 h-3.5 w-3.5' />
              {t('timebound.customCta')}
            </Button>
          </div>
          {customOpen ? (
            <div className='flex flex-wrap items-end gap-2'>
              <label className='flex min-w-[9rem] flex-1 flex-col gap-1 text-xs text-muted-foreground'>
                {t('timebound.from')}
                <input
                  type='date'
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className='h-8 rounded-lg border border-border/70 bg-background px-2.5 text-xs text-foreground outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-primary'
                />
              </label>
              <label className='flex min-w-[9rem] flex-1 flex-col gap-1 text-xs text-muted-foreground'>
                {t('timebound.to')}
                <input
                  type='date'
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className='h-8 rounded-lg border border-border/70 bg-background px-2.5 text-xs text-foreground outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-primary'
                />
              </label>
              <Button
                type='button'
                size='sm'
                className='h-8 rounded-lg px-3 text-xs'
                onClick={applyCustomRange}
              >
                {t('timebound.apply')}
              </Button>
            </div>
          ) : null}
          <p className='text-xs text-muted-foreground'>
            {t('timebound.activeRange', { range: toDateRangeLabel(activeRange, locale) })}
          </p>
        </div>
      </CardHeader>
      <CardContent className='min-h-[300px]'>
        {metricsQuery.isError && !metricsQuery.data ? (
          <div className='flex h-[240px] items-center justify-center text-center text-sm text-muted-foreground'>
            {t('error.partialDescription')}
          </div>
        ) : metricsQuery.isLoading && !metricsQuery.data ? (
          <div className='space-y-3'>
            <Skeleton className='mx-auto h-44 w-44 rounded-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-4/5' />
            <Skeleton className='h-4 w-3/5' />
          </div>
        ) : totalChannelLeads === 0 ? (
          <div className='flex h-[240px] items-center justify-center text-center text-sm text-muted-foreground'>
            {t('charts.channelsEmpty')}
          </div>
        ) : (
          <div className='flex min-h-[240px] flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:gap-3'>
            <div className='relative mx-auto size-44 shrink-0 sm:mx-0 sm:size-40'>
              <ChartContainer
                config={channelChartConfig}
                className='aspect-square size-full min-h-[11rem] [&>div]:justify-center'
              >
                {useBarChart ? (
                  <BarChart
                    accessibilityLayer
                    data={channelData}
                    layout='vertical'
                    margin={{ top: 8, right: 8, left: 12, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                    <XAxis type='number' hide />
                    <YAxis
                      type='category'
                      dataKey='channel'
                      width={96}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(value: string) =>
                        leadStatusLabel[value as keyof typeof leadStatusLabel]
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey='channel' />}
                    />
                    <Bar dataKey='leads' radius={6}>
                      {channelData.map((entry) => (
                        <Cell key={entry.channel} fill={`var(--color-${entry.channel})`} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart accessibilityLayer>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey='channel' />}
                    />
                    <Pie
                      data={channelPieData}
                      dataKey='leads'
                      nameKey='channel'
                      innerRadius={52}
                      outerRadius={72}
                      strokeWidth={3}
                    />
                  </PieChart>
                )}
              </ChartContainer>
              {!useBarChart ? (
                <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
                  <p className='text-2xl font-bold tabular-nums text-foreground'>
                    {totalChannelLeads.toLocaleString()}
                  </p>
                  <p className='text-[10px] text-muted-foreground'>{t('charts.leads')}</p>
                </div>
              ) : null}
            </div>
            <div className='w-full min-w-0 space-y-2.5 sm:flex-1'>
              {LEAD_STATUS_ORDER.map((status) => {
                const row = channelData.find((c) => c.channel === status);
                const count = row ? Number(row.leads ?? 0) : 0;
                const pct =
                  totalChannelLeads > 0 ? Math.round((count / totalChannelLeads) * 100) : 0;
                return (
                  <div key={status} className='flex items-center justify-between gap-2 text-sm'>
                    <div className='flex min-w-0 items-center gap-2'>
                      <span
                        className='size-2.5 shrink-0 rounded-full'
                        style={STATUS_DOT_STYLES[status]}
                      />
                      <span className='truncate text-muted-foreground'>
                        {leadStatusLabel[status]}
                      </span>
                    </div>
                    <div className='flex shrink-0 items-baseline gap-1.5 tabular-nums'>
                      <span className='font-semibold text-foreground'>{count}</span>
                      <span className='text-xs text-muted-foreground'>({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

function AgentDashboardPerformanceSection() {
  return (
    <section className='grid grid-cols-1 gap-4 xl:grid-cols-12'>
      <AgentPerformanceChartSection />
      <AgentLeadChannelsCard />
    </section>
  );
}

export function AgentDashboardView() {
  const t = useTranslations('AgentDashboard');
  const metricsQuery = useAgentDashboardMetrics();
  const appointmentsQuery = useAgentAppointmentsSnapshot();
  const planQuery = useAgentPlanSnapshot();

  const loading = metricsQuery.isLoading || appointmentsQuery.isLoading || planQuery.isLoading;

  const hasError =
    metricsQuery.isError &&
    !metricsQuery.data &&
    appointmentsQuery.isError &&
    !appointmentsQuery.data &&
    planQuery.isError &&
    !planQuery.data;

  const hasPartialError = metricsQuery.isError || appointmentsQuery.isError || planQuery.isError;

  const metrics = metricsQuery.data?.data;
  const listingTrend = buildTrend(
    metrics?.listingSummary.currentMonthAll ?? 0,
    metrics?.listingSummary.previousAll ?? 0
  );
  const propertyTrend = buildTrend(
    metrics?.propertySummary.currentMonthTotalProperties ?? 0,
    metrics?.propertySummary.previousTotalProperties ?? 0
  );
  const appointmentTrend = buildTrend(
    metrics?.appointmentSummary.currentMonthUpcomingAppointments ?? 0,
    metrics?.appointmentSummary.previousUpcomingAppointments ?? 0
  );
  const crmTrend = buildTrend(
    metrics?.crmSummary.totalLeads ?? 0,
    metrics?.crmSummary.previousTotalLeads ?? 0
  );
  const kpis = [
    {
      id: 'active-listings',
      value: metrics?.listingSummary.all ?? 0,
      trend: listingTrend.trend,
      deltaPercent: listingTrend.deltaPercent,
      unit: undefined,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      icon: <Home className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />,
    },
    {
      id: 'delegated-properties',
      value: metrics?.propertySummary.totalProperties ?? 0,
      trend: propertyTrend.trend,
      deltaPercent: propertyTrend.deltaPercent,
      unit: undefined,
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      icon: <Building2 className='h-4 w-4 text-amber-600 dark:text-amber-400' />,
    },
    {
      id: 'open-appointments',
      value: metrics?.appointmentSummary.upcomingAppointments ?? 0,
      trend: appointmentTrend.trend,
      deltaPercent: appointmentTrend.deltaPercent,
      unit: undefined,
      iconBg: 'bg-sky-100 dark:bg-sky-500/20',
      icon: <CalendarDays className='h-4 w-4 text-sky-600 dark:text-sky-400' />,
    },
    {
      id: 'crm-leads',
      value: metrics?.crmSummary.totalLeads ?? 0,
      trend: crmTrend.trend,
      deltaPercent: crmTrend.deltaPercent,
      unit: undefined,
      iconBg: 'bg-rose-100 dark:bg-rose-500/20',
      icon: <Users className='h-4 w-4 text-rose-600 dark:text-rose-400' />,
    },
  ];

  if (loading) {
    return (
      <div className='flex h-full min-h-[360px] items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
      </div>
    );
  }

  if (hasError) {
    return (
      <Card className='border-destructive/40'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-destructive'>
            <CircleAlert className='h-5 w-5' />
            {t('error.title')}
          </CardTitle>
          <CardDescription>{t('error.description')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className='space-y-6 p-4 md:p-6'>
      {hasPartialError && !hasError && (
        <Card className='border-amber-400/40 bg-amber-50/40 dark:bg-amber-900/10'>
          <CardHeader className='py-4'>
            <CardTitle className='flex items-center gap-2 text-amber-700 dark:text-amber-300'>
              <CircleAlert className='h-4 w-4' />
              {t('error.partialTitle')}
            </CardTitle>
            <CardDescription>{t('error.partialDescription')}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Metrics Session */}
      <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {kpis.map((kpi) => {
          const trendUp = kpi.trend === 'up';
          return (
            <Card key={kpi.id} className='border-border/70 bg-card shadow-sm'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between gap-2'>
                  <CardDescription>{t(`kpi.${kpi.id}`)}</CardDescription>
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl',
                      kpi.iconBg
                    )}
                  >
                    {kpi.icon}
                  </div>
                </div>
                <CardTitle className='text-2xl font-semibold'>
                  {kpi.value.toLocaleString()}
                  {kpi.unit ? ` ${kpi.unit}` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className='flex items-center gap-2 text-sm'>
                {trendUp ? (
                  <TrendingUp className='h-4 w-4 text-emerald-500' />
                ) : (
                  <TrendingDown className='h-4 w-4 text-amber-500' />
                )}
                <span className={trendUp ? 'text-emerald-600' : 'text-amber-600'}>
                  {t('kpi.vsLastMonth', { value: kpi.deltaPercent })}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <AgentDashboardPerformanceSection />

      <AgentDashboardTopListingsCard />

      <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <AgentDashboardAppointmentsCard />

        <AgentDashboardPlanCard />
      </section>
    </div>
  );
}
