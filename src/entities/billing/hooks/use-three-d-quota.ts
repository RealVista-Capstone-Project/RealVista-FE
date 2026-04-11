'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { billingQueries } from '../api/billing.queries';
import { billingKeys } from '../api/keys';
import type { ActiveSubscriptionResponse } from '../model/billing.types';

export interface ThreeDQuota {
  remaining: number | null;
  quotaLimit: number | null;
  unlimited: boolean;
  isLocked: boolean;
  isLoading: boolean;
  isError: boolean;
  decrementQuota: () => void;
  invalidateQuota: () => void;
}

export function useThreeDQuota(): ThreeDQuota {
  const queryClient = useQueryClient();
  const { data: subscriptions, isLoading, isError } = useQuery(billingQueries.mySubscriptions());

  const threeDSub = subscriptions?.find(
    (s: ActiveSubscriptionResponse) => s.feature_type === '3D_TOUR' && s.status === 'ACTIVE'
  );

  const remaining = threeDSub?.remaining_quota ?? null;
  const quotaLimit = threeDSub?.quota_limit ?? null;
  const unlimited = threeDSub?.unlimited ?? false;

  const isLocked = !isLoading && !isError && (
    !threeDSub || (!threeDSub.unlimited && (threeDSub.remaining_quota ?? 0) <= 0)
  );

  const decrementQuota = useCallback(() => {
    queryClient.setQueryData<ActiveSubscriptionResponse[]>(
      billingKeys.mySubscriptions(),
      (old) => {
        if (!old) return old;
        return old.map((sub) => {
          if (sub.feature_type === '3D_TOUR' && sub.status === 'ACTIVE' && !sub.unlimited && sub.remaining_quota != null) {
            return { ...sub, remaining_quota: Math.max(0, sub.remaining_quota - 1) };
          }
          return sub;
        });
      }
    );
  }, [queryClient]);

  const invalidateQuota = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: billingKeys.mySubscriptions() });
  }, [queryClient]);

  return {
    remaining,
    quotaLimit,
    unlimited,
    isLocked,
    isLoading,
    isError,
    decrementQuota,
    invalidateQuota,
  };
}
