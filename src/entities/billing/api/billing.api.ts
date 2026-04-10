import http from '@/shared/lib/http';
import type {
  ActiveSubscriptionResponse,
  ActiveBoostPackageResponse,
  BoostPackage,
  CheckoutRequest,
  CheckoutResponse,
  FeaturePackage,
  TransactionStatusResponse,
  TransactionResponse,
} from '../model/billing.types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const billingApi = {
  getSubscriptionPlans: () =>
    http.get<ApiResponse<FeaturePackage[]>>('/billing/plans/subscriptions'),

  getBoostPackages: () =>
    http.get<ApiResponse<BoostPackage[]>>('/billing/plans/boosts'),

  checkout: (body: CheckoutRequest) =>
    http.post<ApiResponse<CheckoutResponse>>('/billing/checkout', body),

  getCheckoutOrderStatus: (checkoutOrderId: string) =>
    http.get<ApiResponse<TransactionStatusResponse>>(
      `/billing/transactions/${checkoutOrderId}/status`
    ),

  /** Ask PayOS if the bank transfer completed; completes subscription on BE when PayOS says paid (no webhook needed). */
  syncPayOsFromCheckoutOrder: (checkoutOrderId: string) =>
    http.post<ApiResponse<TransactionStatusResponse>>(
      `/billing/transactions/${checkoutOrderId}/sync-payos`,
      {}
    ),

  getMySubscriptions: () =>
    http.get<ApiResponse<ActiveSubscriptionResponse[]>>('/billing/subscriptions/me'),

  getMyBoosts: () =>
    http.get<ApiResponse<ActiveBoostPackageResponse[]>>('/billing/boosts/me'),

  cancelSubscription: (subscriptionId: string) =>
    http.delete<ApiResponse<null>>(`/billing/subscriptions/${subscriptionId}`),

  cancelBoost: (boostPackageId: string) =>
    http.delete<ApiResponse<null>>(`/billing/boosts/${boostPackageId}`),

  getTransactions: () =>
    http.get<ApiResponse<TransactionResponse[]>>('/billing/transactions/me'),

  saveTransaction: (transactionId: string) =>
    http.post<ApiResponse<TransactionResponse>>(
      `/billing/transactions/${transactionId}/save`,
      {}
    ),
};
