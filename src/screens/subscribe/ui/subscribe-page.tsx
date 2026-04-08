'use client';

import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BillingReturnQueryEffects } from '@/widgets/billing/ui/billing-return-query-effects';
import { SubscriptionTab } from '@/widgets/billing/ui/subscription-tab';

function SubscribePageContent() {
  const router = useRouter();
  const t = useTranslations('Subscribe');

  return (
    <>
      <BillingReturnQueryEffects />
      <div className='min-h-screen bg-white'>
        {/* Header with background */}
        <div className='bg-gradient-to-r from-purple-96 to-purple-92 px-4 py-8 sm:px-6'>
          <div className='mx-auto w-full max-w-3xl'>
            <button
              type='button'
              onClick={() => router.back()}
              className='mb-4 inline-flex items-center gap-2 text-main-black hover:opacity-80 transition-opacity'
              aria-label='Go back'
            >
              <ArrowLeft className='h-5 w-5' />
              <span className='text-sm font-medium'>{t('backButton')}</span>
            </button>
            <h1 className='text-3xl sm:text-4xl font-bold text-main-primary'>
              {t('headingPrefix')} <span className='text-main-primary'>{t('headingSuffix')}</span>
            </h1>
            <p className='mt-2 text-base text-main-primary'>
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
        <div className='flex min-h-screen items-center justify-center bg-grey-100'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-main-primary' />
        </div>
      }
    >
      <SubscribePageContent />
    </Suspense>
  );
}
