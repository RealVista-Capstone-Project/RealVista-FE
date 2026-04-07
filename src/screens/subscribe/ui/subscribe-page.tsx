'use client';

import { Suspense } from 'react';
import { BillingReturnQueryEffects } from '@/widgets/billing/ui/billing-return-query-effects';
import { SubscriptionTab } from '@/widgets/billing/ui/subscription-tab';
import { Link } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';

function SubscribePageContent() {
  return (
    <>
      <BillingReturnQueryEffects />
      <div className='min-h-screen bg-grey-100 px-4 py-8 sm:px-6'>
        <div className='mx-auto w-full max-w-3xl'>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
            <h1 className='text-xl font-semibold text-main-black sm:text-2xl'>Gói dịch vụ</h1>
            <Link
              href={ROUTES.homePage}
              className='text-sm font-medium text-main-primary underline-offset-4 hover:underline'
            >
              Về trang chủ
            </Link>
          </div>
          <SubscriptionTab />
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
