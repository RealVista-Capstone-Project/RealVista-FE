'use client';

import { Link } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/ui/chart';
import { Progress } from '@/shared/ui/progress';
import {
  useAgentAppointmentsSnapshot,
  useAgentDashboardMetrics,
  useAgentPerformanceMetrics,
  useAgentPlanSnapshot,
} from '../api/use-agent-dashboard';
import {
  ArrowUpRight,
  CalendarDays,
  CircleAlert,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { User } from 'next-auth';
import { useLocale, useTranslations } from 'next-intl';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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

export function AgentDashboardView({ user }: { user?: User }) {
  const t = useTranslations('AgentDashboard');
  const locale = useLocale();
  const metricsQuery = useAgentDashboardMetrics();
  const performanceQuery = useAgentPerformanceMetrics();
  const appointmentsQuery = useAgentAppointmentsSnapshot();
  const planQuery = useAgentPlanSnapshot();
  const name = user?.name || user?.email?.split('@')[0] || 'Agent';

  const performanceChartConfig = {
    views: { label: t('charts.views'), color: 'var(--chart-1)' },
    inquiries: { label: t('charts.inquiries'), color: 'var(--chart-2)' },
  } as const;

  const channelChartConfig = {
    leads: { label: t('charts.leads'), color: 'var(--chart-4)' },
  } as const;

  const loading =
    metricsQuery.isLoading ||
    performanceQuery.isLoading ||
    appointmentsQuery.isLoading ||
    planQuery.isLoading;

  const hasError =
    metricsQuery.isError ||
    performanceQuery.isError ||
    appointmentsQuery.isError ||
    planQuery.isError;

  const kpis = metricsQuery.data?.data.kpis ?? [];
  const trendData = performanceQuery.data?.data.trend ?? [];
  const channelData = performanceQuery.data?.data.channels ?? [];
  const appointments = appointmentsQuery.data?.data.appointments ?? [];
  const plan = planQuery.data?.data;

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

      <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader>
            <CardTitle>{t('sections.performance.title')}</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>{t('sections.channels.title')}</CardTitle>
            <CardDescription>{t('sections.channels.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className='h-[280px] w-full' config={channelChartConfig}>
              <BarChart data={channelData} layout='vertical' margin={{ left: 4, right: 8 }}>
                <CartesianGrid horizontal={false} strokeDasharray='3 3' />
                <XAxis type='number' hide />
                <YAxis
                  type='category'
                  dataKey='channel'
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tickFormatter={(value: string) => t(`channels.${value}`)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey='leads' radius={8} fill='var(--color-leads)' />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader>
            <CardTitle>{t('sections.appointments.title')}</CardTitle>
            <CardDescription>{t('sections.appointments.description')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className='flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 md:flex-row md:items-center md:justify-between'
              >
                <div>
                  <p className='font-medium text-foreground'>{appointment.title}</p>
                  <p className='text-xs text-muted-foreground'>{appointment.location}</p>
                </div>
                <div className='flex items-center gap-3 text-xs'>
                  <span className='inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-primary'>
                    <CalendarDays className='h-3.5 w-3.5' />
                    {formatDashboardDate(appointment.startsAt, locale)}
                  </span>
                  <span className='rounded-full border border-border px-2.5 py-1 uppercase tracking-wide text-muted-foreground'>
                    {t(`status.${appointment.status}`)}
                  </span>
                </div>
              </div>
            ))}
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
