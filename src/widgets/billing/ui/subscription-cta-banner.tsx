'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { billingQueries } from '@/entities/billing';
import type { ActiveSubscriptionResponse } from '@/entities/billing';

const DISMISS_KEY = 'realvista:cta:subscription:dismissed';

const ALLOWED_PATH_SUFFIXES = ['/dashboard/listings', '/dashboard/property'];

function hasActiveSubscription(subscriptions: ActiveSubscriptionResponse[]): boolean {
  return subscriptions.some((s) => s.status === 'ACTIVE');
}

export function SubscriptionCTABanner() {
  const t = useTranslations('SubscriptionCTABanner');
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  // Read dismiss flag from localStorage on mount (client-only)
  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === 'true') {
      setDismissed(true);
    }
  }, []);

  // Delay banner appearance by 3 seconds after mount
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const { data: subscriptions, isLoading } = useQuery(billingQueries.mySubscriptions());

  const isOnTargetPage = pathname != null && ALLOWED_PATH_SUFFIXES.some((suffix) =>
    pathname.endsWith(suffix)
  );

  const isSubscribed =
    !isLoading && subscriptions != null && hasActiveSubscription(subscriptions);

  const visible = show && isOnTargetPage && !dismissed && !isSubscribed && !isLoading;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  function handleUpgrade() {
    router.push(`/${locale}/subscribe`);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key='subscription-cta-banner'
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className='fixed bottom-4 right-4 z-50'
        >
          <div className='w-[280px] rounded-xl border bg-white shadow-lg p-4 flex flex-col gap-3'>
            {/* Badge */}
            <span className='w-fit text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full'>
              {t('badge')}
            </span>

            {/* Text */}
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-bold text-foreground leading-snug'>
                {t('title')}
              </p>
              <p className='text-xs text-muted-foreground leading-snug'>
                {t('description')}
              </p>
            </div>

            {/* CTA Button */}
            <button
              type='button'
              onClick={handleUpgrade}
              className='w-full rounded-lg bg-foreground text-background text-xs font-semibold py-2 hover:bg-foreground/90 transition-colors cursor-pointer'
            >
              {t('cta')}
            </button>

            {/* Dismiss */}
            <button
              type='button'
              onClick={handleDismiss}
              className='text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer text-center'
            >
              {t('dismiss')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
