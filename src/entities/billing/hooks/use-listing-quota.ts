'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { billingQueries } from '../api/billing.queries';
import { billingKeys } from '../api/keys';
import type { ActiveSubscriptionResponse } from '../model/billing.types';

export interface ListingQuota {
  remaining: number | null;
  quotaLimit: number | null;
  unlimited: boolean;
  isLocked: boolean;
  isLoading: boolean;
  isError: boolean;
  decrementQuota: () => void;
  invalidateQuota: () => void;
}

export function useListingQuota(): ListingQuota {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAuthenticated = !!(session as any)?.user?.accessToken;
  const { data: subscriptions, isLoading, isError } = useQuery({ ...billingQueries.mySubscriptions(), enabled: isAuthenticated });

  const listingSub = subscriptions?.find(
    (s: ActiveSubscriptionResponse) => s.feature_type === 'LISTING' && s.status === 'ACTIVE'
  );

  const remaining = listingSub?.remaining_quota ?? null;
  const quotaLimit = listingSub?.quota_limit ?? null;
  const unlimited = listingSub?.unlimited ?? false;

  const isLocked = !isLoading && !isError && (
    !listingSub || (!listingSub.unlimited && (listingSub.remaining_quota ?? 0) <= 0)
  );

  const decrementQuota = useCallback(() => {
    queryClient.setQueryData<ActiveSubscriptionResponse[]>(
      billingKeys.mySubscriptions(),
      (old) => {
        if (!old) return old;
        return old.map((sub) => {
          if (sub.feature_type === 'LISTING' && sub.status === 'ACTIVE' && !sub.unlimited && sub.remaining_quota != null) {
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
