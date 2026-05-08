import type { ActiveSubscriptionResponse } from '../model/billing.types';

/** Đồng bộ với FeaturePackageTierHelper (BE) — tier 0 = miễn phí */
export function packageTierLevelFromCode(code: string): number {
  switch (code) {
    case 'LISTING_FREE':
    case '3D_TOUR_FREE':
    case 'AI_FREE':
      return 0;
    case 'LISTING_10':
    case '3D_TOUR_5':
    case 'AI_50':
      return 1;
    case 'LISTING_25':
    case '3D_TOUR_15':
    case 'AI_100':
      return 2;
    case 'LISTING_50':
    case '3D_TOUR_30':
    case 'AI_200':
      return 3;
    case 'LISTING_UNLIMITED':
    case '3D_TOUR_UNLIMITED':
    case 'AI_UNLIMITED':
      return 4;
    default:
      return 0;
  }
}

/** Gói 3D trả phí đang active (bỏ qua 3D_TOUR_FREE / tier 0). */
export function isActivePaid3dTourSubscription(sub: ActiveSubscriptionResponse): boolean {
  if (sub.feature_type !== '3D_TOUR' || sub.status !== 'ACTIVE') return false;
  const tier = sub.tier_level ?? packageTierLevelFromCode(sub.package_code);
  return tier > 0;
}

export function hasPaidActive3dTourPlan(subscriptions: ActiveSubscriptionResponse[]): boolean {
  return subscriptions.some(isActivePaid3dTourSubscription);
}
