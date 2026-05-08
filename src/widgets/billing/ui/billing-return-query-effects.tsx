'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingKeys } from '@/entities/billing';
import { listingBoostKeys } from '@/entities/listing';
import { env } from '@/shared/lib/env/env';

/**
 * Subscribed landing after VNPAY redirects with `?payment=…`. Same-tab history still has VNPay under this page — avoid
 * `router.back()` on /subscribe header (sandbox would open again).
 */
export const BILLING_VNPAY_RETURN_TAB_KEY = 'billing-vnpay-return-tab';

/**
 * VNPay Return URL: forwards vnp_* to BE (HMAC only); BE redirects here with ?payment=success&checkout_order_id=...
 * FE then calls POST /billing/payment/vnpay-verify (QueryDR). Toasts for other ?payment= values (failed, cancelled, etc.).
 */
export function BillingReturnQueryEffects() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const vnPayForwardRef = useRef(false);
  useEffect(() => {
    if (!searchParams) return;
    const hasVnp =
      searchParams.has('vnp_ResponseCode') ||
      searchParams.has('vnp_SecureHash') ||
      searchParams.has('vnp_TxnRef');
    if (!hasVnp) {
      vnPayForwardRef.current = false;
      return;
    }
    if (vnPayForwardRef.current) return;
    vnPayForwardRef.current = true;
    const apiBase = env.NEXT_PUBLIC_API_ENDPOINT.replace(/\/$/, '');
    window.location.replace(`${apiBase}/billing/payment/vnpay-return?${searchParams.toString()}`);
  }, [searchParams]);

  const paymentNotifyShownRef = useRef(false);
  useEffect(() => {
    if (!searchParams) return;
    const payment = searchParams.get('payment');
    if (!payment) {
      paymentNotifyShownRef.current = false;
      return;
    }

    try {
      sessionStorage.setItem(BILLING_VNPAY_RETURN_TAB_KEY, '1');
    } catch {
      /* non-fatal */
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete('payment');
    next.delete('checkout_order_id');
    const qs = next.toString();
    if (!pathname) return;
    router.replace(qs ? `${pathname}?${qs}` : pathname);

    if (paymentNotifyShownRef.current) return;
    paymentNotifyShownRef.current = true;

    switch (payment) {
      case 'success': {
        const checkoutOrderId = searchParams.get('checkout_order_id');
        if (checkoutOrderId) {
          sessionStorage.setItem(
            'billing-vnpay-pending-verify',
            JSON.stringify({ checkoutOrderId })
          );
        } else {
          sessionStorage.setItem('billing-payment-success', '1');
          toast.success('Thanh toán thành công! Gói dịch vụ đã được kích hoạt.');
          void Promise.all([
            queryClient.invalidateQueries({ queryKey: billingKeys.all, refetchType: 'all' }),
            queryClient.invalidateQueries({ queryKey: listingBoostKeys.all, refetchType: 'all' }),
          ]).catch(() => {
            /* non-fatal */
          });
        }
        break;
      }
      case 'failed':
        toast.error('Thanh toán không thành công. Vui lòng thử lại.');
        break;
      case 'invalid_signature':
        toast.error('Không xác thực được giao dịch từ cổng thanh toán.');
        break;
      case 'not_found':
        toast.error('Không tìm thấy giao dịch thanh toán.');
        break;
      case 'no_params':
        toast.error('Thiếu thông tin trả về từ cổng thanh toán.');
        break;
      case 'cancelled':
        toast.info('Bạn đã hủy thanh toán.');
        break;
      default:
        break;
    }
  }, [pathname, queryClient, router, searchParams]);

  return null;
}
