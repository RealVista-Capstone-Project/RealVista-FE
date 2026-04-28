import { queryOptions } from '@tanstack/react-query';
import { adminBillingApi, billingApi } from './billing.api';
import { billingKeys } from './keys';

export const billingQueries = {
  subscriptionPlans: () =>
    queryOptions({
      queryKey: billingKeys.subscriptionPlans(),
      queryFn: async () => {
        const res = await billingApi.getSubscriptionPlans();
        return res.payload.data;
      },
      staleTime: 10 * 60 * 1000,
    }),

  boostPackages: () =>
    queryOptions({
      queryKey: billingKeys.boostPackages(),
      queryFn: async () => {
        const res = await billingApi.getBoostPackages();
        return res.payload.data;
      },
      staleTime: 10 * 60 * 1000,
    }),

  mySubscriptions: () =>
    queryOptions({
      queryKey: billingKeys.mySubscriptions(),
      queryFn: async () => {
        const res = await billingApi.getMySubscriptions();
        return res.payload.data;
      },
      staleTime: 2 * 60 * 1000,
    }),

  myBoosts: () =>
    queryOptions({
      queryKey: billingKeys.myBoosts(),
      queryFn: async () => {
        const res = await billingApi.getMyBoosts();
        return res.payload.data;
      },
      staleTime: 2 * 60 * 1000,
    }),

  transactionStatus: (checkoutOrderId: string) =>
    queryOptions({
      queryKey: billingKeys.transactionStatus(checkoutOrderId),
      queryFn: async () => {
        const res = await billingApi.getCheckoutOrderStatus(checkoutOrderId);
        return res.payload.data;
      },
      enabled: !!checkoutOrderId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === 'PENDING') return 2000;
        return false;
      },
      staleTime: 0,
    }),

  myTransactions: () =>
    queryOptions({
      queryKey: billingKeys.myTransactions(),
      queryFn: async () => {
        const res = await billingApi.getTransactions();
        return res.payload.data;
      },
      staleTime: 5 * 60 * 1000,
    }),

  adminFeaturePackages: (includeInactive = true) =>
    queryOptions({
      queryKey: billingKeys.adminFeaturePackages(includeInactive),
      queryFn: async () => {
        const res = await adminBillingApi.getFeaturePackages(includeInactive);
        return res.payload.data;
      },
      staleTime: 5 * 60 * 1000,
    }),

  adminBoostPackages: (includeInactive = true) =>
    queryOptions({
      queryKey: billingKeys.adminBoostPackages(includeInactive),
      queryFn: async () => {
        const res = await adminBillingApi.getBoostPackages(includeInactive);
        return res.payload.data;
      },
      staleTime: 5 * 60 * 1000,
    }),
} as const;
