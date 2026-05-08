'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Loader2, Package, ArrowRight } from 'lucide-react';
import { Link } from '@/shared/config/i18n/navigation';
import { billingQueries, type ActiveSubscriptionResponse } from '@/entities/billing';
import { cn } from '@/shared/lib/utils';

function formatShortDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US');
}

const FEATURE_TYPE_STYLES: Record<string, string> = {
  LISTING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  '3D_TOUR': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  AI_REQUEST: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

function FeatureTypeChip({
  featureType,
  t,
}: {
  featureType: string;
  t: ReturnType<typeof useTranslations<'OwnerDashboard.purchasedPackages'>>;
}) {
  const colorClass = FEATURE_TYPE_STYLES[featureType] ?? 'bg-muted text-muted-foreground';
  const label =
    featureType === 'LISTING' || featureType === '3D_TOUR' || featureType === 'AI_REQUEST'
      ? t(`featureType.${featureType}` as Parameters<typeof t>[0])
      : featureType;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
        colorClass,
      )}
    >
      {label}
    </span>
  );
}

export function OwnerPurchasedPackagesCard() {
  const t = useTranslations('OwnerDashboard.purchasedPackages');
  const locale = useLocale();
  const { data: subscriptions, isLoading } = useQuery(billingQueries.mySubscriptions());

  const activePlans = useMemo(
    () => (subscriptions ?? []).filter((sub: ActiveSubscriptionResponse) => sub.status === 'ACTIVE'),
    [subscriptions],
  );

  return (
    <div className='flex min-h-[280px] flex-col gap-4 rounded-[24px] border border-sky-200/60 bg-card p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-border dark:shadow-none'>
      <div className='flex shrink-0 items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
            <Package className='h-4 w-4 text-primary' />
          </div>
          <h3 className='text-base font-semibold'>{t('title')}</h3>
        </div>
        <Link
          href='/subscribe'
          className='flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground'
        >
          {t('viewAll')}
          <ArrowRight className='h-3 w-3' />
        </Link>
      </div>

      <div className='flex flex-col overflow-x-hidden pr-1'>
        {isLoading ? (
          <div className='flex items-center gap-2 rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground'>
            <Loader2 className='h-4 w-4 animate-spin text-primary' />
            <span>{t('loading')}</span>
          </div>
        ) : activePlans.length === 0 ? (
          <div className='flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-6'>
            <p className='text-center text-xs text-muted-foreground'>{t('empty')}</p>
          </div>
        ) : (
          <ul className='flex flex-col gap-3'>
            {activePlans.map((sub: ActiveSubscriptionResponse) => (
            <li
              key={sub.subscription_id}
              className='rounded-xl border border-black/[0.06] bg-muted/20 px-4 py-3 dark:border-border'
            >
              <div className='flex items-start justify-between gap-2'>
                <p className='text-sm font-semibold leading-snug'>{sub.package_name}</p>
                <FeatureTypeChip featureType={sub.feature_type} t={t} />
              </div>
              <div className='mt-2 flex items-center gap-1.5 text-xs text-muted-foreground'>
                <CalendarDays className='h-3.5 w-3.5 shrink-0' />
                <span>
                  {sub.end_date
                    ? t('expires', { date: formatShortDate(sub.end_date, locale) })
                    : t('noExpiry')}
                </span>
              </div>
              {!sub.unlimited && sub.quota_limit != null && (
                <p className={cn('mt-1 text-xs text-muted-foreground')}>
                  {t('quota', {
                    used: Math.max(0, sub.quota_limit - (sub.remaining_quota ?? 0)),
                    total: sub.quota_limit,
                  })}
                </p>
              )}
              {sub.unlimited && (
                <p className='mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                  {t('unlimited')}
                </p>
              )}
            </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
