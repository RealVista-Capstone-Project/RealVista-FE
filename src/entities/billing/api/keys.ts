export const billingKeys = {
  all: ['billing'] as const,
  subscriptionPlans: () => [...billingKeys.all, 'subscription-plans'] as const,
  boostPackages: () => [...billingKeys.all, 'boost-packages'] as const,
  mySubscriptions: () => [...billingKeys.all, 'my-subscriptions'] as const,
  transactionStatus: (id: string) => [...billingKeys.all, 'transaction-status', id] as const,
  myTransactions: () => [...billingKeys.all, 'my-transactions'] as const,
};
