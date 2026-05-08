'use client';

import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useAuthSession } from '@/features/auth/model';
import { Skeleton } from '@/shared/ui/skeleton';
import { useOwnerHeroInsights } from '../api';

function formatCount(value?: number) {
  if (value === undefined) return '--';
  return value.toLocaleString();
}

export function HeroPanel() {
  const t = useTranslations('OwnerDashboard.hero');
  const locale = useLocale();
  const { data: session } = useAuthSession();
  const { data: hero, isLoading } = useOwnerHeroInsights();

  const dateLocale = locale === 'vi' ? vi : enUS;
  const formattedDate = format(new Date(), 'EEEE, d MMMM, yyyy', { locale: dateLocale });

  const contactTotal =
    (hero?.chat_messages_on_listings ?? 0) + (hero?.appointments_on_owner_listings ?? 0);

  const rawName = session?.user?.name?.trim();
  const emailLocal = session?.user?.email?.split('@')[0]?.trim();
  const displayName =
    rawName ||
    (emailLocal && emailLocal.length > 0 ? emailLocal : null) ||
    t('welcomeGuest');

  return (
    <div className='relative min-h-0 bg-transparent lg:min-h-0'>
      {/*
        House PNG on the right: background height tracks section; transparent areas show dashboard bg.
      */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-0 hidden bg-[url("/hourse.png")] bg-[length:auto_100%] bg-[position:right_bottom] bg-no-repeat lg:block'
      />
      <div className='relative z-10 grid min-h-[260px] grid-cols-1 items-start lg:min-h-0 lg:grid-cols-10 lg:gap-0'>
        {/* ~60% — content; ~40% is clear for the background artwork */}
        <div className='relative flex flex-col px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7 lg:col-span-6'>
          <div>
            <p className='mb-3 text-sm font-medium capitalize text-muted-foreground'>{formattedDate}</p>

            <div className='mb-10 max-w-xl sm:mb-12'>
              <p className='text-sm font-medium leading-snug text-muted-foreground sm:text-base'>
                {t('welcomePrefix')}
              </p>
              <p className='mt-1 text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl'>
                {displayName}
              </p>
              <p className='mt-1 text-sm font-medium leading-snug text-muted-foreground sm:text-base'>
                {t('welcomeSuffix')}
              </p>
            </div>

            <div className='grid max-w-lg grid-cols-2 gap-4 sm:gap-5'>
              <div className='flex flex-col gap-2 rounded-2xl border border-primary/35 bg-primary/10 px-4 py-3 shadow-sm dark:border-primary/45 dark:bg-primary/15'>
                <p className='text-xs font-medium text-muted-foreground'>{t('contactTouches')}</p>
                {isLoading ? (
                  <Skeleton className='h-10 w-28 rounded-lg' />
                ) : (
                  <p className='text-2xl font-bold tracking-tight text-primary sm:text-3xl'>
                    {formatCount(contactTotal)}
                  </p>
                )}
              </div>
              <div className='flex flex-col gap-2 rounded-2xl border border-primary/35 bg-primary/10 px-4 py-3 shadow-sm dark:border-primary/45 dark:bg-primary/15'>
                <p className='text-xs font-medium text-muted-foreground'>{t('listingViews')}</p>
                {isLoading ? (
                  <Skeleton className='h-10 w-28 rounded-lg' />
                ) : (
                  <p className='text-2xl font-bold tracking-tight text-primary sm:text-3xl'>
                    {formatCount(hero?.listing_views_total)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
