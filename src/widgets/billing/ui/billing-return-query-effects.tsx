'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingKeys } from '@/entities/billing';
import { env } from '@/shared/lib/env/env';

/**
 * VNPay Return URL: forwards vnp_* to API (verify + activate); BE then redirects browser here with ?payment=...
 * Also shows toasts for ?payment= on return from PayOS cancel or post-VNPay redirect.
 */
export function BillingReturnQueryEffects() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const vnPayForwardRef = useRef(false);
  useEffect(() => {
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
    const payment = searchParams.get('payment');
    if (!payment) {
      paymentNotifyShownRef.current = false;
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete('payment');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);

    if (paymentNotifyShownRef.current) return;
    paymentNotifyShownRef.current = true;

    switch (payment) {
      case 'success':
        toast.success('Thanh toán thành công! Gói dịch vụ đã được kích hoạt.');
        queryClient.invalidateQueries({ queryKey: billingKeys.all });
        break;
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
