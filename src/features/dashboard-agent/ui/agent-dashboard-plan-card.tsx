'use client';

import { useAgentPlanSnapshot } from '../api/use-agent-dashboard';
import type { AgentPlanBoostRow, AgentPlanSubscriptionRow } from '../model/agent-dashboard.types';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import {
  Box,
  BrainCircuit,
  Building2,
  CalendarDays,
  Infinity,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { memo, useMemo, type ReactNode } from 'react';

function formatDate(date: string | null | undefined, locale: string) {
  if (!date) return '--';
  return new Date(date).toLocaleDateString(locale);
}

type FeatureType = 'LISTING' | '3D_TOUR' | 'AI_REQUEST' | string;

interface FeatureMeta {
  label: string;
  icon: ReactNode;
  gradient: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  progressColor: string;
  accentBorder: string;
}

function getFeatureMeta(featureType: FeatureType, t: ReturnType<typeof useTranslations>): FeatureMeta {
  switch (featureType) {
    case 'LISTING':
      return {
        label: t('sections.plan.featureType.listing'),
        icon: <Building2 className='h-4 w-4' />,
        gradient: 'from-amber-500/10 to-orange-500/5',
        iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
        badgeBg: 'bg-amber-100 dark:bg-amber-500/20',
        badgeText: 'text-amber-700 dark:text-amber-400',
        progressColor: '[&_[data-slot=progress-indicator]]:bg-amber-500',
        accentBorder: 'border-l-amber-500',
      };
    case '3D_TOUR':
      return {
        label: t('sections.plan.featureType.tour3d'),
        icon: <Box className='h-4 w-4' />,
        gradient: 'from-violet-500/10 to-purple-500/5',
        iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
        badgeBg: 'bg-violet-100 dark:bg-violet-500/20',
        badgeText: 'text-violet-700 dark:text-violet-400',
        progressColor: '[&_[data-slot=progress-indicator]]:bg-violet-500',
        accentBorder: 'border-l-violet-500',
      };
    case 'AI_REQUEST':
      return {
        label: t('sections.plan.featureType.aiRequest'),
        icon: <BrainCircuit className='h-4 w-4' />,
        gradient: 'from-sky-500/10 to-cyan-500/5',
        iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
        badgeBg: 'bg-sky-100 dark:bg-sky-500/20',
        badgeText: 'text-sky-700 dark:text-sky-400',
        progressColor: '[&_[data-slot=progress-indicator]]:bg-sky-500',
        accentBorder: 'border-l-sky-500',
      };
    default:
      return {
        label: featureType,
        icon: <Sparkles className='h-4 w-4' />,
        gradient: 'from-emerald-500/10 to-teal-500/5',
        iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20',
        badgeText: 'text-emerald-700 dark:text-emerald-400',
        progressColor: '[&_[data-slot=progress-indicator]]:bg-emerald-500',
        accentBorder: 'border-l-emerald-500',
      };
  }
}

function getUsagePercent(sub: AgentPlanSubscriptionRow): number {
  if (sub.unlimited || sub.quota_limit == null || sub.quota_limit <= 0) return 100;
  const remaining = sub.remaining_quota ?? 0;
  const used = Math.max(0, sub.quota_limit - remaining);
  return Math.round((used / sub.quota_limit) * 100);
}

function getDaysRemaining(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function translatePlanStatus(status: string, t: ReturnType<typeof useTranslations>): string {
  const normalized = status.trim().toLowerCase();
  const statusKeyMap: Record<string, string> = {
    active: 'active',
    expired: 'expired',
    canceled: 'canceled',
    cancelled: 'canceled',
    pending: 'pending',
    paused: 'paused',
    completed: 'completed',
  };
  const statusKey = statusKeyMap[normalized] ?? 'unknown';
  return t(`sections.plan.statusValue.${statusKey}`);
}

interface PlanSubscriptionRowProps {
  sub: AgentPlanSubscriptionRow;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}

function PlanSubscriptionRow({ sub, t, locale }: PlanSubscriptionRowProps) {
  const meta = getFeatureMeta(sub.feature_type, t);
  const usagePercent = getUsagePercent(sub);
  const daysLeft = getDaysRemaining(sub.end_date);
  const quotaLimit = sub.quota_limit ?? 0;
  const remaining = Math.min(sub.remaining_quota ?? 0, quotaLimit);
  const used = Math.max(0, quotaLimit - remaining);
  const isLow = !sub.unlimited && usagePercent >= 80;

  const startedDate = sub.start_date ? new Date(sub.start_date).toLocaleDateString(locale) : '-';

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 overflow-hidden rounded-xl border border-l-4 bg-card p-4 shadow-sm',
        meta.accentBorder,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60',
          meta.gradient,
        )}
      />

      <div className='relative flex items-start justify-between gap-2'>
        <div className='flex items-center gap-2.5'>
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.iconBg)}>
            {meta.icon}
          </div>
          <div className='flex flex-col'>
            <p className='line-clamp-1 text-sm font-semibold leading-tight'>{sub.package_name}</p>
            <span
              className={cn(
                'mt-0.5 w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold',
                meta.badgeBg,
                meta.badgeText,
              )}
            >
              {meta.label}
            </span>
          </div>
        </div>

        {daysLeft !== null && (
          <div
            className={cn(
              'shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold',
              daysLeft <= 7
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {t('sections.plan.daysLeft', { days: daysLeft })}
          </div>
        )}
      </div>

      <div className='relative space-y-0.5 text-xs text-muted-foreground'>
        <p>
          {t('sections.plan.status')}: {translatePlanStatus(sub.status, t)}
        </p>
        <p>{t('sections.plan.startedOn', { date: startedDate })}</p>
      </div>

      <div className='relative flex flex-col gap-1.5'>
        {sub.unlimited ? (
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <Infinity className='h-3.5 w-3.5 text-primary' />
            <span className='font-medium text-foreground'>{t('sections.plan.unlimitedQuota')}</span>
          </div>
        ) : (
          <>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-muted-foreground'>
                {t('sections.plan.usedQuota', { used, total: quotaLimit })}
              </span>
              <span className={cn('font-semibold', isLow ? 'text-rose-500' : 'text-foreground')}>
                {remaining} {t('sections.plan.remaining')}
              </span>
            </div>
            <Progress
              value={usagePercent}
              className={cn(
                'h-1.5',
                isLow
                  ? '[&_[data-slot=progress-indicator]]:bg-rose-500'
                  : meta.progressColor,
              )}
            />
          </>
        )}
      </div>

      {sub.end_date ? (
        <div className='relative flex items-center gap-1.5 text-xs text-muted-foreground'>
          <CalendarDays className='h-3.5 w-3.5 shrink-0' />
          <span>{t('sections.plan.expireAt', { date: formatDate(sub.end_date, locale) })}</span>
        </div>
      ) : null}
    </div>
  );
}

interface PlanBoostRowProps {
  boost: AgentPlanBoostRow;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}

function PlanBoostRow({ boost, t, locale }: PlanBoostRowProps) {
  const daysLeft = getDaysRemaining(boost.end_date);
  const startDate = boost.start_date ? new Date(boost.start_date).toLocaleDateString(locale) : '-';
  const featuredQuota = boost.featured_quota ?? 0;
  const hotBadgeQuota = boost.hot_badge_quota ?? 0;
  const remainingFeatured = Math.max(0, boost.remaining_featured_quota ?? 0);
  const remainingHotBadge = Math.max(0, boost.remaining_hot_badge_quota ?? 0);
  const usedFeatured = Math.max(0, featuredQuota - remainingFeatured);
  const usedHotBadge = Math.max(0, hotBadgeQuota - remainingHotBadge);
  const featuredPercent = featuredQuota > 0 ? Math.round((usedFeatured / featuredQuota) * 100) : 0;
  const hotBadgePercent = hotBadgeQuota > 0 ? Math.round((usedHotBadge / hotBadgeQuota) * 100) : 0;
  const isFeaturedLow = featuredQuota > 0 && featuredPercent >= 80;
  const isHotBadgeLow = hotBadgeQuota > 0 && hotBadgePercent >= 80;

  return (
    <div className='relative flex flex-col gap-3 overflow-hidden rounded-xl border border-l-4 border-l-rose-500 bg-card p-4 shadow-sm'>
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/10 to-amber-500/5 opacity-60' />

      <div className='relative flex items-start justify-between gap-2'>
        <div className='flex items-center gap-2.5'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'>
            <Zap className='h-4 w-4' />
          </div>
          <div className='flex flex-col'>
            <p className='line-clamp-1 text-sm font-semibold leading-tight'>{boost.name}</p>
            <span className='mt-0.5 w-fit rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'>
              {t('sections.plan.boost')}
            </span>
          </div>
        </div>

        {daysLeft !== null && (
          <div
            className={cn(
              'shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold',
              daysLeft <= 7
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {t('sections.plan.daysLeft', { days: daysLeft })}
          </div>
        )}
      </div>

      <div className='relative space-y-0.5 text-xs text-muted-foreground'>
        <p>
          {t('sections.plan.status')}: {translatePlanStatus(boost.status, t)}
        </p>
        <p>{t('sections.plan.startedOn', { date: startDate })}</p>
      </div>

      <div className='relative space-y-2 text-xs'>
        <div className='space-y-1.5'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-muted-foreground'>
              {t('sections.plan.boostFeaturedQuota', { used: usedFeatured, total: featuredQuota })}
            </span>
            <span className={cn('font-semibold', isFeaturedLow ? 'text-rose-500' : 'text-foreground')}>
              {remainingFeatured} {t('sections.plan.remaining')}
            </span>
          </div>
          <Progress
            value={featuredPercent}
            className={cn(
              'h-1.5',
              isFeaturedLow
                ? '[&_[data-slot=progress-indicator]]:bg-rose-500'
                : '[&_[data-slot=progress-indicator]]:bg-amber-500',
            )}
          />
        </div>
        <div className='space-y-1.5'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-muted-foreground'>
              {t('sections.plan.boostHotBadgeQuota', { used: usedHotBadge, total: hotBadgeQuota })}
            </span>
            <span className={cn('font-semibold', isHotBadgeLow ? 'text-rose-500' : 'text-foreground')}>
              {remainingHotBadge} {t('sections.plan.remaining')}
            </span>
          </div>
          <Progress
            value={hotBadgePercent}
            className={cn(
              'h-1.5',
              isHotBadgeLow
                ? '[&_[data-slot=progress-indicator]]:bg-rose-500'
                : '[&_[data-slot=progress-indicator]]:bg-sky-500',
            )}
          />
        </div>
      </div>

      {boost.end_date ? (
        <div className='relative flex items-center gap-1.5 text-xs text-muted-foreground'>
          <CalendarDays className='h-3.5 w-3.5 shrink-0' />
          <span>{t('sections.plan.expireAt', { date: formatDate(boost.end_date, locale) })}</span>
        </div>
      ) : null}
    </div>
  );
}

export const AgentDashboardPlanCard = memo(function AgentDashboardPlanCard() {
  const t = useTranslations('AgentDashboard');
  const locale = useLocale();
  const planQuery = useAgentPlanSnapshot();

  const activePlans = useMemo(() => {
    const subscriptions = planQuery.data?.data.subscriptions ?? [];
    return subscriptions.filter((sub) => sub.status === 'ACTIVE');
  }, [planQuery.data]);
  const activeBoosts = useMemo(() => {
    const boosts = planQuery.data?.data.boosts ?? [];
    return boosts.filter((boost) => boost.status === 'ACTIVE');
  }, [planQuery.data]);

  const isLoading = planQuery.isLoading && !planQuery.data;

  return (
    <Card className='xl:col-span-3'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Zap className='h-4 w-4 text-primary' />
          {t('sections.plan.title')}
        </CardTitle>
        <CardDescription>{t('sections.plan.description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {isLoading ? (
          <div className='flex items-center gap-2 rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground'>
            <Loader2 className='h-4 w-4 animate-spin text-primary' />
            <span>{t('sections.plan.loading')}</span>
          </div>
        ) : activePlans.length === 0 && activeBoosts.length === 0 ? (
          <div className='rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
            {t('sections.plan.empty')}
          </div>
        ) : (
          <>
            {activePlans.length > 0 ? (
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  {t('sections.plan.subscriptions')}
                </p>
                {activePlans.map((sub) => (
                  <PlanSubscriptionRow key={sub.subscription_id} sub={sub} t={t} locale={locale} />
                ))}
              </div>
            ) : null}
            {activeBoosts.length > 0 ? (
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  {t('sections.plan.boosts')}
                </p>
                {activeBoosts.map((boost) => (
                  <PlanBoostRow key={boost.boost_package_id} boost={boost} t={t} locale={locale} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
});
