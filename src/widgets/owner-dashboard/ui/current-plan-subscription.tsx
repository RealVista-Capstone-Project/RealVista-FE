'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Loader2,
  Sparkles,
  Building2,
  Box,
  BrainCircuit,
  ArrowRight,
  Infinity,
} from 'lucide-react';
import { Link } from '@/shared/config/i18n/navigation';
import { billingQueries } from '@/entities/billing';
import type { ActiveSubscriptionResponse } from '@/entities/billing';
import { Progress } from '@/shared/ui/progress';
import { cn } from '@/shared/lib/utils';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function formatDate(date: string | null | undefined) {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('vi-VN');
}

type FeatureType = 'LISTING' | '3D_TOUR' | 'AI_REQUEST' | string;

interface FeatureMeta {
  label: string;
  icon: React.ReactNode;
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
        label: t('currentPlan.featureType.listing'),
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
        label: t('currentPlan.featureType.tour3d'),
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
        label: t('currentPlan.featureType.aiRequest'),
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

function getUsagePercent(sub: ActiveSubscriptionResponse): number {
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

/* ─── sub-component: single plan card ─────────────────────────────────────── */

interface PlanCardProps {
  sub: ActiveSubscriptionResponse;
  t: ReturnType<typeof useTranslations>;
}

function PlanCard({ sub, t }: PlanCardProps) {
  const meta = getFeatureMeta(sub.feature_type, t);
  const usagePercent = getUsagePercent(sub);
  const daysLeft = getDaysRemaining(sub.end_date);
  const quotaLimit = sub.quota_limit ?? 0;
  const remaining = Math.min(sub.remaining_quota ?? 0, quotaLimit);
  const used = Math.max(0, quotaLimit - remaining);
  const isLow = !sub.unlimited && usagePercent >= 80;

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-xl border border-l-4 bg-card p-4 shadow-sm overflow-hidden',
        meta.accentBorder,
      )}
    >
      {/* gradient glow */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60',
          meta.gradient,
        )}
      />

      {/* header row */}
      <div className='relative flex items-start justify-between gap-2'>
        <div className='flex items-center gap-2.5'>
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', meta.iconBg)}>
            {meta.icon}
          </div>
          <div className='flex flex-col'>
            <p className='text-sm font-semibold leading-tight line-clamp-1'>{sub.package_name}</p>
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

        {/* days remaining pill */}
        {daysLeft !== null && (
          <div
            className={cn(
              'shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold',
              daysLeft <= 7
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {daysLeft}d
          </div>
        )}
      </div>

      {/* quota section */}
      <div className='relative flex flex-col gap-1.5'>
        {sub.unlimited ? (
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <Infinity className='h-3.5 w-3.5 text-primary' />
            <span className='font-medium text-foreground'>{t('currentPlan.unlimitedQuota')}</span>
          </div>
        ) : (
          <>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-muted-foreground'>{t('currentPlan.usedQuota', { used, total: quotaLimit })}</span>
              <span className={cn('font-semibold', isLow ? 'text-rose-500' : 'text-foreground')}>
                {remaining} {t('currentPlan.remaining')}
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

      {/* footer: expiry */}
      <div className='relative flex items-center gap-1.5 text-xs text-muted-foreground'>
        <CalendarDays className='h-3.5 w-3.5 shrink-0' />
        <span>{t('currentPlan.expireAt', { date: formatDate(sub.end_date) })}</span>
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */

export function CurrentPlanSubscription() {
  const t = useTranslations('OwnerDashboard.schedule');
  const { data: subscriptions, isLoading } = useQuery(billingQueries.mySubscriptions());

  const activePlans = useMemo(
    () => (subscriptions ?? []).filter((sub) => sub.status === 'ACTIVE'),
    [subscriptions],
  );

  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
      {/* section header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10'>
            <Sparkles className='h-3.5 w-3.5 text-primary' />
          </div>
          <h3 className='text-sm font-semibold'>{t('currentPlan.title')}</h3>
        </div>

        {activePlans.length > 0 && (
          <Link href='/subscribe' className='flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground'>
            {t('currentPlan.viewAll')}
            <ArrowRight className='h-3 w-3' />
          </Link>
        )}
      </div>

      {/* body */}
      {isLoading ? (
        <div className='flex items-center gap-2 rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin text-primary' />
          <span>{t('currentPlan.loading')}</span>
        </div>
      ) : activePlans.length === 0 ? (
        <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted'>
            <Sparkles className='h-4 w-4 text-muted-foreground' />
          </div>
          <p className='text-xs font-medium text-muted-foreground'>{t('currentPlan.empty')}</p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {activePlans.map((sub) => (
            <PlanCard key={sub.subscription_id} sub={sub} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
