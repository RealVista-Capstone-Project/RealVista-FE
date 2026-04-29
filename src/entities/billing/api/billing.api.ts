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
  CreateFeaturePackageRequest,
  UpdateFeaturePackageRequest,
  CreateBoostPackageRequest,
  UpdateBoostPackageRequest,
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

// ───────────────────────────────────────────────────────────────────────────────
// Admin Billing API
// ───────────────────────────────────────────────────────────────────────────────

export const adminBillingApi = {
  // ── Feature Packages ──────────────────────────────────────────────────────────
  getFeaturePackages: (includeInactive = true) =>
    http.get<ApiResponse<FeaturePackage[]>>(
      `/admin/billing/feature-packages?include_inactive=${includeInactive}`
    ),

  createFeaturePackage: (body: CreateFeaturePackageRequest) =>
    http.post<ApiResponse<FeaturePackage>>(`/admin/billing/feature-packages`, body),

  updateFeaturePackage: (id: string, body: UpdateFeaturePackageRequest) =>
    http.put<ApiResponse<FeaturePackage>>(`/admin/billing/feature-packages/${id}`, body),

  deleteFeaturePackage: (id: string) =>
    http.delete<ApiResponse<null>>(`/admin/billing/feature-packages/${id}`),

  activateFeaturePackage: (id: string) =>
    http.patch<ApiResponse<FeaturePackage>>(
      `/admin/billing/feature-packages/${id}/activate`,
      {}
    ),

  deactivateFeaturePackage: (id: string) =>
    http.patch<ApiResponse<FeaturePackage>>(
      `/admin/billing/feature-packages/${id}/deactivate`,
      {}
    ),

  // ── Boost Packages ────────────────────────────────────────────────────────────
  getBoostPackages: (includeInactive = true) =>
    http.get<ApiResponse<BoostPackage[]>>(
      `/admin/billing/boost-packages?include_inactive=${includeInactive}`
    ),

  createBoostPackage: (body: CreateBoostPackageRequest) =>
    http.post<ApiResponse<BoostPackage>>(`/admin/billing/boost-packages`, body),

  updateBoostPackage: (id: string, body: UpdateBoostPackageRequest) =>
    http.put<ApiResponse<BoostPackage>>(`/admin/billing/boost-packages/${id}`, body),

  deleteBoostPackage: (id: string) =>
    http.delete<ApiResponse<null>>(`/admin/billing/boost-packages/${id}`),

  activateBoostPackage: (id: string) =>
    http.patch<ApiResponse<BoostPackage>>(
      `/admin/billing/boost-packages/${id}/activate`,
      {}
    ),

  deactivateBoostPackage: (id: string) =>
    http.patch<ApiResponse<BoostPackage>>(
      `/admin/billing/boost-packages/${id}/deactivate`,
      {}
    ),
};
