'use client';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  useAgentAppointmentsSnapshot,
  useAgentDashboardMetrics,
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
import { useTranslations } from 'next-intl';

const AgentDashboardInsightsCard = dynamic(
  () =>
    import('./agent-dashboard-insights-card').then((m) => ({
      default: m.AgentDashboardInsightsCard,
    })),
  {
    loading: () => (
      <Card className='border-border/70 bg-card shadow-sm'>
        <CardContent className='space-y-6 pt-6'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <Skeleton className='h-6 w-48 max-w-full' />
                <Skeleton className='h-8 w-28 rounded-xl' />
              </div>
              <Skeleton className='h-4 w-full max-w-lg' />
            </div>
            <Skeleton className='h-52 w-full' />
          </div>
          <div className='border-t border-border/60 pt-6'>
            <div className='space-y-4'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='space-y-2'>
                  <Skeleton className='h-6 w-56 max-w-full' />
                  <Skeleton className='h-4 w-full max-w-md' />
                </div>
                <Skeleton className='h-8 w-40 rounded-xl' />
              </div>
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
            </div>
          </div>
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
      <Card className='xl:col-span-5'>
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
      <Card className='xl:col-span-3'>
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

const AgentLeadChannelsCard = dynamic(
  () =>
    import('./agent-dashboard-lead-channels-card').then((m) => ({
      default: m.AgentLeadChannelsCard,
    })),
  {
    loading: () => (
      <Card className='border-border/70 bg-card shadow-sm xl:col-span-4'>
        <CardHeader className='space-y-4'>
          <Skeleton className='h-6 w-40 max-w-full' />
          <Skeleton className='h-20 w-full rounded-xl' />
        </CardHeader>
        <CardContent className='space-y-3'>
          <Skeleton className='mx-auto h-44 w-44 rounded-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
        </CardContent>
      </Card>
    ),
  }
);

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

      <AgentDashboardInsightsCard />

      <section className='grid grid-cols-1 gap-4 xl:grid-cols-12'>
        <AgentLeadChannelsCard />

        <AgentDashboardAppointmentsCard />

        <AgentDashboardPlanCard />
      </section>
    </div>
  );
}
