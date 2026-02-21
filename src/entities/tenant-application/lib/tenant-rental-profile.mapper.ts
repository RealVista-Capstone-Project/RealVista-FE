import { TenantRentalProfile } from '../model/types';

export function mapToTenantRentalProfile(item: any): TenantRentalProfile {
  return {
    profileId: item.profile_id || item.profileId,
    userId: item.user_id || item.userId,
    title: item.title,
    monthlyIncome: item.monthly_income || item.monthlyIncome,
    moveInDate: item.move_in_date || item.moveInDate,
    leaseTermMonths: item.lease_term_months || item.leaseTermMonths,
    note: item.note,
    isActive: item.is_active || item.isActive,
    createdAt: item.created_at || item.createdAt,
    updatedAt: item.updated_at || item.updatedAt,
  };
}
