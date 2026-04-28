export const billingKeys = {
  all: ['billing'] as const,
  subscriptionPlans: () => [...billingKeys.all, 'subscription-plans'] as const,
  boostPackages: () => [...billingKeys.all, 'boost-packages'] as const,
  mySubscriptions: () => [...billingKeys.all, 'my-subscriptions'] as const,
  myBoosts: () => [...billingKeys.all, 'my-boosts'] as const,
  transactionStatus: (id: string) => [...billingKeys.all, 'transaction-status', id] as const,
  myTransactions: () => [...billingKeys.all, 'my-transactions'] as const,
  adminFeaturePackages: (includeInactive?: boolean) =>
    [...billingKeys.all, 'admin-feature-packages', includeInactive] as const,
  adminBoostPackages: (includeInactive?: boolean) =>
    [...billingKeys.all, 'admin-boost-packages', includeInactive] as const,
};
