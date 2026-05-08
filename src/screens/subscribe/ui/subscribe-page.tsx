'use client';

import { Suspense, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft } from 'lucide-react';
import {
  BillingReturnQueryEffects,
  BILLING_VNPAY_RETURN_TAB_KEY,
} from '@/widgets/billing/ui/billing-return-query-effects';
import { SubscriptionTab } from '@/widgets/billing/ui/subscription-tab';
import { TopNavContainer } from '@/shared/ui/top-nav';
import { Button } from '@/shared/ui/button';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';

function SubscribePageContent() {
  const t = useTranslations('Subscribe');
  const router = useRouter();

  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(BILLING_VNPAY_RETURN_TAB_KEY);
      } catch {
        /* non-fatal */
      }
    };
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem(BILLING_VNPAY_RETURN_TAB_KEY) === '1') {
          sessionStorage.removeItem(BILLING_VNPAY_RETURN_TAB_KEY);
          router.push(ROUTES.homePage);
          return;
        }
      } catch {
        /* fall through */
      }
    }
    router.back();
  };

  return (
    <>
      <BillingReturnQueryEffects />
      <TopNavContainer variant='public' />
      <div className='min-h-screen bg-white'>
        {/* Header with background */}
        <div className='bg-gradient-to-r from-primary/5 to-primary/20 px-4 py-8 sm:px-6'>
          <div className='mx-auto w-full max-w-3xl'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='mb-4 -ml-2 gap-1 text-primary hover:bg-primary/10 hover:text-primary'
              onClick={handleBack}
            >
              <ChevronLeft className='h-4 w-4 shrink-0' />
              {t('backButton')}
            </Button>
            <h1 className='text-3xl sm:text-4xl font-bold text-primary'>
              {t('headingPrefix')} <span className='text-primary'>{t('headingSuffix')}</span>
            </h1>
            <p className='mt-2 text-base text-primary'>
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className='px-4 py-8 sm:px-6'>
          <div className='mx-auto w-full max-w-3xl'>
            <SubscriptionTab />
          </div>
        </div>
      </div>
    </>
  );
}

export function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-muted'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary' />
        </div>
      }
    >
      <SubscribePageContent />
    </Suspense>
  );
}
