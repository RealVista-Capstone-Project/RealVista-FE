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

export interface ActiveBoostPackageResponse {
  boost_package_id: string;
  code: string;
  name: string;
  description: string;
  featured_quota: number;
  hot_badge_quota: number;
  duration_days: number;
  start_date: string;
  end_date: string | null;
  remaining_featured_quota: number | null;
  remaining_hot_badge_quota: number | null;
  status: string;
}

export interface CheckoutRequest {
  plan_code: string;
  plan_type: PlanType;
  payment_method: PaymentMethodType;
}

export interface CheckoutResponse {
  checkout_order_id: string;
  order_code: number;
  checkout_url: string;
  /** Only present for PayOS */
  qr_code?: string;
  payment_method: PaymentMethodType;
  plan_name: string;
  amount: number;
}

export interface TransactionStatusResponse {
  transaction_id: string;
  status: PaymentStatus;
  plan_code: string;
  plan_type: PlanType;
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
  transaction_id: string;
  plan_code: string;
  plan_type: PlanType;
  payment_method: PaymentMethodType;
  status: PaymentStatus;
  amount: number;
  created_at: string;
  description: string;
}
