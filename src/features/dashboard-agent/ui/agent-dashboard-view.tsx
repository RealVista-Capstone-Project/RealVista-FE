'use client';

import { Link } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
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
import type {
  AgentAppointmentTabFilter,
  AppointmentItem,
  AgentPerformancePeriod,
} from '../model/agent-dashboard.types';
import {
  useAgentAppointmentsSnapshot,
  useAgentDashboardMetrics,
  useAgentPerformanceMetrics,
  useAgentPlanSnapshot,
} from '../api/use-agent-dashboard';
import {
  ArrowUpRight,
  CircleAlert,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { User } from 'next-auth';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from 'recharts';

/** Order matches CRM so legend and slice semantics stay consistent. */
const LEAD_SOURCE_ORDER = ['manual', 'chat', 'tour'] as const;

const SOURCE_DOT_STYLES: Record<(typeof LEAD_SOURCE_ORDER)[number], { background: string }> = {
  manual: { background: 'var(--primary)' },
  chat: { background: 'var(--chart-2)' },
  tour: { background: 'var(--chart-3)' },
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

function toSafeDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatCalendarHeaderDate(value: Date, locale: string) {
  return value.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function AgentDashboardView({ user }: { user?: User }) {
  const t = useTranslations('AgentDashboard');
  const locale = useLocale();
  const [selectedPeriod, setSelectedPeriod] = useState<AgentPerformancePeriod>('M');
  const metricsQuery = useAgentDashboardMetrics();
  const performanceQuery = useAgentPerformanceMetrics(selectedPeriod);
  const appointmentsQuery = useAgentAppointmentsSnapshot();
  const planQuery = useAgentPlanSnapshot();
  const name = user?.name || user?.email?.split('@')[0] || 'Agent';

  const performanceChartConfig = {
    views: { label: t('charts.views'), color: 'var(--chart-1)' },
    inquiries: { label: t('charts.inquiries'), color: 'var(--chart-2)' },
  } as const;

  const channelChartConfig = {
    manual: { label: t('charts.source.manual'), color: 'var(--primary)' },
    chat: { label: t('charts.source.chat'), color: 'var(--chart-2)' },
    tour: { label: t('charts.source.tour'), color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  const leadSourceLabel = {
    manual: t('charts.source.manual'),
    chat: t('charts.source.chat'),
    tour: t('charts.source.tour'),
  } as const;

  const loading =
    metricsQuery.isLoading ||
    performanceQuery.isLoading ||
    appointmentsQuery.isLoading ||
    planQuery.isLoading;

  const hasError =
    metricsQuery.isError &&
    !metricsQuery.data &&
    performanceQuery.isError &&
    !performanceQuery.data &&
    appointmentsQuery.isError &&
    !appointmentsQuery.data &&
    planQuery.isError &&
    !planQuery.data;

  const hasPartialError =
    metricsQuery.isError ||
    performanceQuery.isError ||
    appointmentsQuery.isError ||
    planQuery.isError;

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
  const trendData = performanceQuery.data?.data.trend ?? [];
  const channelData = (performanceQuery.data?.data.channels ?? []).map((channel) => ({
    ...channel,
    channel: channel.channel.toLowerCase(),
  }));
  const totalChannelLeads = channelData.reduce((sum, row) => sum + Number(row.leads ?? 0), 0);
  const channelPieData = channelData.map((row) => ({
    ...row,
    channel: row.channel,
    leads: Number(row.leads ?? 0),
    fill: `var(--color-${row.channel})`,
  }));
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
  const [selectedAppointmentDay, setSelectedAppointmentDay] = useState<Date | undefined>(new Date());
  const [visibleCalendarMonth, setVisibleCalendarMonth] = useState<Date>(new Date());
  const plan = planQuery.data?.data;
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

  const selectedDayKey = selectedAppointmentDay ? toDateKey(selectedAppointmentDay, snapshotTimezone) : '';
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

  const tourCount = selectedDayAppointments.filter((item) => item.appointmentType === 'TOUR').length;
  const blockCount = selectedDayAppointments.filter((item) => item.appointmentType === 'BLOCK').length;
  const statusPillClass = (status: AppointmentItem['status']) => {
    if (status === 'ACCEPTED') return 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'COMPLETED') return 'text-sky-700 bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300';
    if (status === 'REJECTED') return 'text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300';
    if (status === 'CANCELED') return 'text-zinc-700 bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300';
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
      <section className='rounded-2xl border border-primary/15 bg-card p-5 shadow-sm'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
              {t('header.title')}
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>{t('header.subtitle', { name })}</p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' asChild>
              <Link href={ROUTES.dashboard.appointments}>
                {t('header.actions.viewAppointments')}
              </Link>
            </Button>
            <Button size='sm' asChild>
              <Link href={ROUTES.dashboard.propertyFeed}>
                {t('header.actions.exploreProperties')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
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

      {/* Performance Chart */}
      <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        {/* Performance Chart Card */}
        <Card className='xl:col-span-2'>
          <CardHeader>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <CardTitle>{t('sections.performance.title')}</CardTitle>
              <div className='inline-flex rounded-lg border border-border/70 p-1'>
                {(['W', 'M', 'Y'] as const).map((period) => (
                  <Button
                    key={period}
                    size='sm'
                    variant={selectedPeriod === period ? 'default' : 'ghost'}
                    className='h-7 px-2 text-xs'
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            <CardDescription>{t('sections.performance.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className='h-[280px] w-full' config={performanceChartConfig}>
              <AreaChart data={trendData} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray='3 3' />
                <XAxis dataKey='month' tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='line' />} />
                <Area
                  type='monotone'
                  dataKey='views'
                  stroke='var(--color-views)'
                  fill='var(--color-views)'
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type='monotone'
                  dataKey='inquiries'
                  stroke='var(--color-inquiries)'
                  fill='var(--color-inquiries)'
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Lead Channels Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.channels.title')}</CardTitle>
            <CardDescription>{t('sections.channels.description')}</CardDescription>
          </CardHeader>
          <CardContent className='min-h-[280px]'>
            {totalChannelLeads === 0 ? (
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
                  </ChartContainer>
                  <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
                    <p className='text-2xl font-bold tabular-nums text-foreground'>
                      {totalChannelLeads.toLocaleString()}
                    </p>
                    <p className='text-[10px] text-muted-foreground'>{t('charts.leads')}</p>
                  </div>
                </div>
                <div className='w-full min-w-0 space-y-2.5 sm:flex-1'>
                  {LEAD_SOURCE_ORDER.map((source) => {
                    const row = channelData.find((c) => c.channel === source);
                    const count = row ? Number(row.leads ?? 0) : 0;
                    const pct =
                      totalChannelLeads > 0 ? Math.round((count / totalChannelLeads) * 100) : 0;
                    return (
                      <div key={source} className='flex items-center justify-between gap-2 text-sm'>
                        <div className='flex min-w-0 items-center gap-2'>
                          <span
                            className='size-2.5 shrink-0 rounded-full'
                            style={SOURCE_DOT_STYLES[source]}
                          />
                          <span className='truncate text-muted-foreground'>
                            {leadSourceLabel[source]}
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
      </section>

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
                    caption_label: 'text-[32px] font-semibold tracking-tight',
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
                      const isTourDay = Boolean(dayStats && dayStats.tourCount > 0);
                      const isBlockDay = Boolean(dayStats && dayStats.blockCount > 0);

                      return (
                        <CalendarDayButton
                          day={day}
                          className={cn(
                            className,
                            'relative h-12 w-full min-w-0 rounded-xl border-0 bg-transparent pb-2 text-foreground transition-colors duration-150 hover:bg-muted/25 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:shadow-none data-[selected-single=true]:[&_.dot-indicator]:bg-primary-foreground/85 md:h-14'
                          )}
                          {...props}
                        >
                          <span className='relative z-10 text-[2rem] leading-none font-normal opacity-100'>
                            {props.children}
                          </span>
                          {(isTourDay || isBlockDay) && (
                            <span className='pointer-events-none absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1'>
                              {isTourDay && (
                                <span className='dot-indicator h-1.5 w-1.5 rounded-full bg-foreground' />
                              )}
                              {isBlockDay && (
                                <span className='dot-indicator h-1.5 w-1.5 rounded-full bg-muted-foreground' />
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

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Zap className='h-4 w-4 text-primary' />
              {t('sections.plan.title')}
            </CardTitle>
            <CardDescription>{t('sections.plan.description')}</CardDescription>
          </CardHeader>
          {plan && (
            <CardContent className='space-y-4'>
              <div className='rounded-xl border border-primary/20 bg-primary/5 p-3'>
                <p className='text-sm font-medium text-foreground'>{plan.planName}</p>
                <p className='text-xs text-muted-foreground'>
                  {t('sections.plan.renewsOn', {
                    date: new Date(plan.renewsAt).toLocaleDateString(locale),
                  })}
                </p>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>{t('sections.plan.listingQuota')}</span>
                  <span>
                    {plan.listingQuotaUsed}/{plan.listingQuotaTotal}
                  </span>
                </div>
                <Progress value={deriveRatio(plan.listingQuotaUsed, plan.listingQuotaTotal)} />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>{t('sections.plan.boostCredits')}</span>
                  <span>
                    {plan.boostsUsed}/{plan.boostsTotal}
                  </span>
                </div>
                <Progress value={deriveRatio(plan.boostsUsed, plan.boostsTotal)} />
              </div>
            </CardContent>
          )}
        </Card>
      </section>

      <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {[
          { label: t('quickActions.propertyFeed'), href: ROUTES.dashboard.propertyFeed },
          { label: t('quickActions.manageProposals'), href: ROUTES.dashboard.manageProposals },
          { label: t('quickActions.crmWorkspace'), href: ROUTES.dashboard.crm },
          { label: t('quickActions.myEngagements'), href: ROUTES.dashboard.myEngagements },
        ].map((item) => (
          <Card key={item.label} className='group'>
            <CardContent className='flex items-center justify-between p-4'>
              <p className='text-sm font-medium text-foreground'>{item.label}</p>
              <Button variant='ghost' size='icon-sm' asChild className='rounded-full'>
                <Link href={item.href} aria-label={item.label}>
                  <ArrowUpRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
