import { Suspense, use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { VnPayReturnRedirect } from '@/widgets/billing/ui/vnpay-return-redirect';

export default function VnPayReturnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <Suspense
      fallback={
        <div className='flex min-h-[50vh] items-center justify-center text-muted-foreground'>
          Đang tải…
        </div>
      }
    >
      <VnPayReturnRedirect />
    </Suspense>
  );
}
