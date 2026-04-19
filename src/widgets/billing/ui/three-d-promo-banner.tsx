'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { billingQueries } from '@/entities/billing';
import type { ActiveSubscriptionResponse } from '@/entities/billing';

const DISMISS_KEY = 'realvista:cta:3d-tour:dismissed';

function hasActive3dTourPlan(subscriptions: ActiveSubscriptionResponse[]): boolean {
  return subscriptions.some((s) => s.feature_type === '3D_TOUR' && s.status === 'ACTIVE');
}

export function ThreeDPromoBanner() {
  const t = useTranslations('ThreeDPromoBanner');
  const router = useRouter();
  const locale = useLocale();

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === 'true') {
      setDismissed(true);
    }
  }, []);

  const { data: session } = useSession();
  const isAuthenticated = !!(session as any)?.user?.accessToken;

  const { data: subscriptions, isLoading } = useQuery({ ...billingQueries.mySubscriptions(), enabled: isAuthenticated });

  const has3dTour =
    !isLoading && subscriptions != null && hasActive3dTourPlan(subscriptions);

  const visible = !dismissed && !has3dTour && !isLoading;

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
          key='three-d-promo-banner'
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <div className='rounded-xl border border-amber-200 bg-amber-50 p-4'>
            <div className='flex flex-row gap-3'>
              {/* Icon */}
              <Sparkles className='h-5 w-5 text-amber-500 mt-0.5 shrink-0' />

              {/* Content */}
              <div className='flex flex-col gap-1 flex-1'>
                <span className='w-fit text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full'>
                  {t('badge')}
                </span>
                <p className='text-sm font-bold text-main-black leading-snug'>
                  {t('title')}
                </p>
                <p className='text-xs text-grey-500 leading-snug'>
                  {t('description')}
                </p>
                <button
                  type='button'
                  onClick={handleUpgrade}
                  className='mt-2 w-fit rounded-lg bg-main-black text-white text-xs font-semibold px-4 py-2 hover:bg-main-black/80 transition-colors cursor-pointer'
                >
                  {t('cta')}
                </button>
              </div>

              {/* Dismiss */}
              <button
                type='button'
                aria-label={t('dismiss')}
                onClick={handleDismiss}
                className='text-amber-400 hover:text-amber-600 transition-colors cursor-pointer shrink-0'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
