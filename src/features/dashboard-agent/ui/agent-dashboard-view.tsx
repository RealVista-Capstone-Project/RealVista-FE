'use client';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar, CalendarDayButton } from '@/shared/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import type {
  AgentAppointmentTabFilter,
  AgentDateRange,
  AppointmentItem,
  AgentPerformancePeriod,
} from '../model/agent-dashboard.types';
import {
  useAgentAppointmentsSnapshot,
  useAgentDashboardMetrics,
  useAgentPerformanceMetrics,
  useAgentPlanSnapshot,
} from '../api/use-agent-dashboard';
import { CalendarDays, CircleAlert, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { memo, useEffect, useMemo, useState } from 'react';
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

const FEATURE_TYPE_VI_LABELS: Record<string, string> = {
  LISTING: 'Tin đăng',
  '3D_TOUR': 'Tour 3D',
  AI_REQUEST: 'AI Chat bot',
};

function formatDashboardDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deriveRatio(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

function toAppointmentStatus(
  status: string
): 'confirmed' | 'pending' | 'completed' | 'rejected' | 'canceled' {
  if (status === 'ACCEPTED') return 'confirmed';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'CANCELED') return 'canceled';
  return 'pending';
}

function toDateKey(value: Date, timezone: string) {
  if (Number.isNaN(value.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function toIsoDateKey(value: string, timezone: string) {
  if (!value) return '';
  return toDateKey(new Date(value), timezone);
}

function getFeatureTypeViLabel(featureType: string) {
  return FEATURE_TYPE_VI_LABELS[featureType] ?? featureType;
}

function toSafeDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toInputDateValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateRangeLabel(range: AgentDateRange, locale: string) {
  const from = new Date(`${range.from}T00:00:00`);
  const to = new Date(`${range.to}T00:00:00`);
  const formatConfig: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
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

function formatCalendarHeaderDate(value: Date, locale: string) {
  return value.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
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
  const minLeadCount = Math.min(...nonZeroChannelData.map((row) => Number(row.leads ?? 0)), maxLeadCount);
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
    if (new Date(`${customFrom}T00:00:00`).getTime() > new Date(`${customTo}T00:00:00`).getTime()) return;
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
              <Button type='button' size='sm' className='h-8 rounded-lg px-3 text-xs' onClick={applyCustomRange}>
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
                      tickFormatter={(value: string) => leadStatusLabel[value as keyof typeof leadStatusLabel]}
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
  const locale = useLocale();
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
  const kpis = [
    {
      id: 'active-listings',
      value: metrics?.listingSummary.all ?? 0,
      trend: 'up' as const,
      deltaPercent: 0,
      unit: undefined,
    },
    {
      id: 'delegated-properties',
      value: metrics?.propertySummary.totalProperties ?? 0,
      trend: 'up' as const,
      deltaPercent: 0,
      unit: undefined,
    },
    {
      id: 'open-appointments',
      value: metrics?.appointmentSummary.upcomingAppointments ?? 0,
      trend: 'up' as const,
      deltaPercent: 0,
      unit: undefined,
    },
    {
      id: 'crm-leads',
      value: metrics?.crmSummary.totalLeads ?? 0,
      trend: 'up' as const,
      deltaPercent: 0,
      unit: undefined,
    },
  ];
  const appointmentSnapshot = appointmentsQuery.data?.data;
  const appointments = useMemo(
    () => appointmentSnapshot?.appointments ?? [],
    [appointmentSnapshot?.appointments]
  );
  const calendarDays = useMemo(
    () => appointmentSnapshot?.calendarDays ?? [],
    [appointmentSnapshot?.calendarDays]
  );
  const [appointmentFilter, setAppointmentFilter] = useState<AgentAppointmentTabFilter>('all');
  const [selectedAppointmentDay, setSelectedAppointmentDay] = useState<Date | undefined>(
    new Date()
  );
  const [visibleCalendarMonth, setVisibleCalendarMonth] = useState<Date>(new Date());
  const plan = planQuery.data?.data;
  const subscriptions = plan?.subscriptions ?? [];
  const snapshotTimezone = appointmentSnapshot?.range.timezone || 'UTC';

  const calendarDayMap = useMemo(() => {
    const map = new Map<string, (typeof calendarDays)[number]>();
    calendarDays.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [calendarDays]);

  useEffect(() => {
    if (!calendarDays.length) {
      const now = new Date();
      setSelectedAppointmentDay(now);
      setVisibleCalendarMonth(now);
      return;
    }

    const todayKey = toDateKey(new Date(), snapshotTimezone);
    const todayMatch = calendarDayMap.get(todayKey);
    if (todayMatch?.hasItems) {
      const day = toSafeDate(todayMatch.date);
      if (day) {
        setSelectedAppointmentDay(day);
        setVisibleCalendarMonth(day);
        return;
      }
    }

    const firstWithItems = calendarDays.find((day) => day.hasItems);
    if (firstWithItems) {
      const day = toSafeDate(firstWithItems.date);
      if (day) {
        setSelectedAppointmentDay(day);
        setVisibleCalendarMonth(day);
        return;
      }
    }

    const firstDay = toSafeDate(calendarDays[0].date);
    if (firstDay) {
      setSelectedAppointmentDay(firstDay);
      setVisibleCalendarMonth(firstDay);
    }
  }, [calendarDayMap, calendarDays, snapshotTimezone]);

  const selectedDayKey = selectedAppointmentDay
    ? toDateKey(selectedAppointmentDay, snapshotTimezone)
    : '';
  const selectedDayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        if (toIsoDateKey(appointment.startTime, snapshotTimezone) !== selectedDayKey) return false;
        if (appointmentFilter === 'tour') return appointment.appointmentType === 'TOUR';
        if (appointmentFilter === 'block') return appointment.appointmentType === 'BLOCK';
        return true;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [appointmentFilter, appointments, selectedDayKey, snapshotTimezone]);

  const tourCount = selectedDayAppointments.filter(
    (item) => item.appointmentType === 'TOUR'
  ).length;
  const blockCount = selectedDayAppointments.filter(
    (item) => item.appointmentType === 'BLOCK'
  ).length;
  const statusPillClass = (status: AppointmentItem['status']) => {
    if (status === 'ACCEPTED')
      return 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'COMPLETED')
      return 'text-sky-700 bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300';
    if (status === 'REJECTED')
      return 'text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300';
    if (status === 'CANCELED')
      return 'text-zinc-700 bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300';
    return 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300';
  };

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
                <CardDescription>{t(`kpi.${kpi.id}`)}</CardDescription>
                <CardTitle className='text-3xl font-semibold'>
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

      <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        {/* Appointments Card */}
        <Card className='xl:col-span-2'>
          <CardHeader>
            <CardTitle>{t('sections.appointments.title')}</CardTitle>
            <CardDescription>{t('sections.appointments.description')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm'>
              <div className='bg-muted/5 px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5'>
                <Calendar
                  mode='single'
                  navLayout='around'
                  selected={selectedAppointmentDay}
                  onSelect={(day) => {
                    setSelectedAppointmentDay(day);
                    if (day) setVisibleCalendarMonth(day);
                  }}
                  month={visibleCalendarMonth}
                  onMonthChange={setVisibleCalendarMonth}
                  className='w-full !p-0'
                  classNames={{
                    root: 'w-full p-0',
                    months: 'w-full',
                    month:
                      'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-4',
                    month_caption:
                      'col-start-2 row-start-1 flex w-full items-center justify-center self-center',
                    button_previous:
                      'col-start-1 row-start-1 justify-self-start h-8 w-8 rounded-full border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-muted/40',
                    button_next:
                      'col-start-3 row-start-1 justify-self-end h-8 w-8 rounded-full border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-muted/40',
                    caption_label: 'text-[28px] font-semibold tracking-tight',
                    table: 'w-full table-fixed border-separate border-spacing-y-2',
                    month_grid: 'col-span-3 row-start-2 w-full',
                    week: 'mt-0 flex w-full',
                    weekdays: 'mb-1 flex w-full',
                    weekday:
                      'w-1/7 text-center text-[18px] font-medium normal-case tracking-normal text-muted-foreground',
                    day: 'w-1/7 py-0.5',
                    outside: 'text-muted-foreground/45 aria-selected:text-muted-foreground/45',
                    today: 'bg-transparent text-foreground',
                  }}
                  components={{
                    DayButton: ({ day, className, ...props }) => {
                      const key = toDateKey(day.date, snapshotTimezone);
                      const dayStats = calendarDayMap.get(key);
                      const tour = dayStats?.tourCount ?? 0;
                      const block = dayStats?.blockCount ?? 0;
                      const total = dayStats?.total ?? 0;
                      const hasItemsDay = Boolean(
                        dayStats && (dayStats.hasItems || total > 0 || tour > 0 || block > 0)
                      );
                      const isTourDay = Boolean(dayStats && tour > 0);
                      const isBlockDay = Boolean(dayStats && block > 0);
                      const showNeutralDot = hasItemsDay && !isTourDay && !isBlockDay;

                      return (
                        <CalendarDayButton
                          day={day}
                          className={cn(
                            className,
                            'relative h-12 w-full min-w-0 rounded-xl border-0 bg-transparent pb-2 text-foreground transition-colors duration-150 hover:bg-muted/25 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:shadow-none data-[selected-single=true]:[&_.dot-indicator]:!bg-primary-foreground/90 md:h-14'
                          )}
                          {...props}
                        >
                          <span className='relative z-10 text-[2rem] leading-none font-normal opacity-100'>
                            {props.children}
                          </span>
                          {(isTourDay || isBlockDay || showNeutralDot) && (
                            <span className='pointer-events-none absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1'>
                              {isTourDay && (
                                <span className='dot-indicator h-2 w-2 shrink-0 rounded-full bg-foreground ring-1 ring-foreground/25' />
                              )}
                              {isBlockDay && (
                                <span className='dot-indicator h-2 w-2 shrink-0 rounded-full bg-muted-foreground ring-1 ring-muted-foreground/30' />
                              )}
                              {showNeutralDot && (
                                <span className='dot-indicator h-2 w-2 shrink-0 rounded-full bg-primary ring-1 ring-primary/30' />
                              )}
                            </span>
                          )}
                        </CalendarDayButton>
                      );
                    },
                  }}
                />
              </div>

              <div className='border-t border-border/70 bg-card/80 px-4 py-3 sm:px-5 sm:py-4'>
                <div className='inline-flex w-full rounded-xl border border-border/70 bg-muted/40 p-1'>
                  {(['all', 'tour', 'block'] as const).map((tab) => (
                    <Button
                      key={tab}
                      size='sm'
                      variant='ghost'
                      className={cn(
                        'h-9 flex-1 rounded-lg text-sm font-medium text-muted-foreground transition-all hover:text-foreground',
                        appointmentFilter === tab &&
                          'bg-background text-foreground shadow-sm hover:bg-background'
                      )}
                      onClick={() => setAppointmentFilter(tab)}
                    >
                      {t(`sections.appointments.tabs.${tab}`)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className='border-t border-border/70 bg-card'>
                <div className='flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-4 py-3 sm:px-5'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    {selectedAppointmentDay
                      ? t('sections.appointments.selectedDate', {
                          date: formatCalendarHeaderDate(selectedAppointmentDay, locale),
                        })
                      : t('sections.appointments.noDateSelected')}
                  </p>
                  <p className='rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground'>
                    {t('sections.appointments.summary', {
                      total: selectedDayAppointments.length,
                      tour: tourCount,
                      block: blockCount,
                    })}
                  </p>
                </div>

                <div className='max-h-[336px] space-y-0 overflow-y-auto'>
                  {selectedAppointmentDay ? null : (
                    <div className='px-4 pb-4 sm:px-5'>
                      <div className='rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
                        {t('sections.appointments.noDateSelected')}
                      </div>
                    </div>
                  )}

                  {selectedAppointmentDay &&
                    (selectedDayAppointments.length === 0 ? (
                      <div className='px-4 pb-4 sm:px-5'>
                        <div className='rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
                          {t('sections.appointments.emptyForFilter')}
                        </div>
                      </div>
                    ) : (
                      selectedDayAppointments.map((appointment: AppointmentItem) => (
                        <div
                          key={appointment.appointmentId}
                          className='flex items-start justify-between gap-3 border-t border-border/60 px-4 py-3.5 transition-colors first:border-t-0 hover:bg-muted/20 sm:px-5'
                        >
                          <div className='min-w-0'>
                            <p className='truncate text-lg font-semibold leading-6 text-foreground'>
                              {appointment.listingName || 'Listing'}
                            </p>
                            <p className='mt-1 truncate text-sm text-muted-foreground'>
                              {appointment.listingAddress || '-'}
                            </p>
                            <p className='mt-1 text-xs font-medium text-muted-foreground'>
                              {formatDashboardDate(appointment.startTime, locale)}
                            </p>
                          </div>
                          <div className='flex shrink-0 flex-col items-end gap-1.5'>
                            <span
                              className={
                                appointment.appointmentType === 'BLOCK'
                                  ? 'rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
                              }
                            >
                              {appointment.appointmentType === 'BLOCK'
                                ? t('sections.appointments.types.block')
                                : t('sections.appointments.types.tour')}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(appointment.status)}`}
                            >
                              {t(`status.${toAppointmentStatus(appointment.status)}`)}
                            </span>
                          </div>
                        </div>
                      ))
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Zap className='h-4 w-4 text-primary' />
              {t('sections.plan.title')}
            </CardTitle>
            <CardDescription>{t('sections.plan.description')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {subscriptions.length === 0 ? (
              <div className='rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
                {t('sections.plan.empty')}
              </div>
            ) : (
              subscriptions.map((subscription) => {
                const quotaLimit = Number(subscription.quota_limit ?? 0);
                const remainingQuota = Number(subscription.remaining_quota ?? 0);
                const usedQuota = Math.max(0, quotaLimit - remainingQuota);
                const hasFiniteQuota = !subscription.unlimited && quotaLimit > 0;
                const startedDate = subscription.start_date
                  ? new Date(subscription.start_date).toLocaleDateString(locale)
                  : '-';
                const quotaLabel = subscription.unlimited
                  ? t('sections.plan.unlimited')
                  : subscription.quota_limit === null || subscription.remaining_quota === null
                    ? '-'
                    : `${remainingQuota}/${quotaLimit}`;

                return (
                  <div
                    key={subscription.subscription_id}
                    className='space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3'
                  >
                    <div className='space-y-1'>
                      <p className='text-sm font-medium text-foreground'>
                        {subscription.package_name}
                      </p>
                      <div className='space-y-0.5 text-xs text-muted-foreground'>
                        <p>
                          {t('sections.plan.feature')}:{' '}
                          {getFeatureTypeViLabel(subscription.feature_type)}
                        </p>
                        <p>
                          {t('sections.plan.status')}: {subscription.status}
                        </p>
                        <p>{t('sections.plan.startedOn', { date: startedDate })}</p>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex items-center justify-between text-xs text-muted-foreground'>
                        <span>{t('sections.plan.quota')}</span>
                        <span>{quotaLabel}</span>
                      </div>
                      {hasFiniteQuota && <Progress value={deriveRatio(usedQuota, quotaLimit)} />}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
