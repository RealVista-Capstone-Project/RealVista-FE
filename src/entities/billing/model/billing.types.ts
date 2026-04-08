export type PlanType = 'SUBSCRIPTION' | 'BOOST';
export type PaymentMethodType = 'PAYOS' | 'VNPAY';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

/** Feature package from GET /billing/plans/subscriptions (à la carte: listing / 3D / AI). */
export interface FeaturePackage {
  id: string;
  code: string;
  name: string;
  description: string;
  feature_type: 'LISTING' | '3D_TOUR' | 'AI_REQUEST';
  quota: number;
  duration_days: number;
  price: number;
  unlimited: boolean;
  free: boolean;
}

/** @deprecated Use FeaturePackage — alias for older naming */
export type SubscriptionPlan = FeaturePackage;

export interface BoostPackage {
  code: string;
  name: string;
  description: string;
  featured_quota: number;
  hot_badge_quota: number;
  duration_days: number;
  price: number;
}

export interface CheckoutRequest {
  plan_code: string;
  plan_type: PlanType;
  payment_method: PaymentMethodType;
}

export interface CheckoutResponse {
  checkoutOrderId: string;
  orderCode: number;
  checkoutUrl: string;
  /** Only present for PayOS */
  qrCode?: string;
  paymentMethod: PaymentMethodType;
  planName: string;
  amount: number;
}

export interface TransactionStatusResponse {
  transactionId: string;
  status: PaymentStatus;
  planCode: string;
  planType: PlanType;
}

/** Active feature subscription from GET /billing/subscriptions/me */
export interface ActiveSubscriptionResponse {
  subscription_id: string;
  package_code: string;
  package_name: string;
  feature_type: string;
  /** Cap for quota bar; null when unlimited */
  quota_limit?: number | null;
  remaining_quota: number | null;
  unlimited: boolean;
  /** 0–4: Free, Basic, Premium, Pro, Pro+ */
  tier_level?: number;
  start_date: string;
  end_date: string | null;
  status: string;
}

export interface TransactionResponse {
  transactionId: string;
  planCode: string;
  planType: PlanType;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
  description: string;
}
