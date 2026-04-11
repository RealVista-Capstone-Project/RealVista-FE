'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { env } from '@/shared/lib/env/env';

/**
 * VNPay redirects here (Return URL on merchant portal). Forwards the full query string to the API,
 * which verifies the signature and redirects the browser to settings with payment status.
 */
export function VnPayReturnRedirect() {
  const searchParams = useSearchParams();
  const locale = useLocale();

  useEffect(() => {
    if (!searchParams) return;
    const q = searchParams.toString();
    const subscribeBase = `${env.NEXT_PUBLIC_URL.replace(/\/$/, '')}/${locale}/subscribe`;
    if (!q) {
      window.location.replace(`${subscribeBase}?payment=no_params`);
      return;
    }
    const apiBase = env.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, '');
    window.location.replace(`${apiBase}/billing/payment/vnpay-return?${q}`);
  }, [searchParams, locale]);

  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground'>
      <p className='text-sm'>Đang xử lý kết quả thanh toán…</p>
    </div>
  );
}
