'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { billingQueries, hasPaidActive3dTourPlan } from '@/entities/billing';

const DISMISS_KEY = 'realvista:cta:3d-tour:dismissed';

export function ThreeDPromoBanner() {
  const t = useTranslations('ThreeDPromoBanner');
  const router = useRouter();
  const locale = useLocale();

  /** Unset until localStorage is read on client */
  const [persistHide, setPersistHide] = useState<boolean | null>(null);
  /** Close (X): hide until navigation/reload only */
  const [sessionDismissed, setSessionDismissed] = useState(false);

  useLayoutEffect(() => {
    try {
      setPersistHide(localStorage.getItem(DISMISS_KEY) === 'true');
    } catch {
      setPersistHide(false);
    }
  }, []);

  const { data: session } = useSession();
  const isAuthenticated = Boolean(
    (session as unknown as { user?: { accessToken?: string } })?.user?.accessToken
  );

  const { data: subscriptions, isLoading } = useQuery({
    ...billingQueries.mySubscriptions(),
    enabled: isAuthenticated,
  });

  const hasPaid3dTour =
    !isLoading && subscriptions != null && hasPaidActive3dTourPlan(subscriptions);

  const visible =
    persistHide === false && !sessionDismissed && !hasPaid3dTour && !isLoading;

  function handleCloseThisVisit() {
    setSessionDismissed(true);
  }

  function handleDontShowAgain() {
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      /* ignore quota / private mode */
    }
    setPersistHide(true);
  }

  function handleUpgrade() {
    router.push(`/${locale}/subscribe`);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key='three-d-promo-banner'
          className='pointer-events-none fixed bottom-4 right-4 z-[100] sm:bottom-5 sm:right-5'
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className='pointer-events-auto relative flex w-[min(17.5rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-lg'
            role='complementary'
            aria-label={t('title')}
          >
            <button
              type='button'
              aria-label={t('closeAria')}
              onClick={handleCloseThisVisit}
              className='absolute right-3 top-3 cursor-pointer rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground'
            >
              <X className='h-4 w-4' />
            </button>

            <div className='flex shrink-0 items-center gap-2 pr-8'>
              <Sparkles className='h-4 w-4 shrink-0 text-amber-500' strokeWidth={2} />
              <span className='w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-500'>
                {t('badge')}
              </span>
            </div>

            <div className='flex flex-col gap-1'>
              <p className='line-clamp-4 text-left text-sm font-bold leading-snug text-foreground'>{t('title')}</p>
              <p className='line-clamp-4 text-left text-xs leading-snug text-muted-foreground'>{t('description')}</p>
            </div>

            <button
              type='button'
              onClick={handleUpgrade}
              className='w-full shrink-0 cursor-pointer rounded-lg bg-foreground py-2 text-center text-xs font-semibold text-background transition-colors hover:bg-foreground/90'
            >
              {t('cta')}
            </button>

            <button
              type='button'
              onClick={handleDontShowAgain}
              className='text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground'
            >
              {t('dontShowAgain')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
