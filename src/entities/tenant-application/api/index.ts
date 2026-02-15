import http from '@/shared/lib/http';
import { TenantApplication } from '../model/types';
import { ApiResponse } from '@/shared/types/api-response';

const BASE_URL = '/tenant-applications';

export const tenantApplicationApi = {
  getMyApplications: async () => {
    const response = await http.get<ApiResponse<any[]>>(BASE_URL);
    return response.payload.data.map((item: any) => ({
      tenantApplicationId: item.tenant_application_id || item.tenantApplicationId,
      userId: item.user_id || item.userId,
      listingId: item.listing_id || item.listingId,
      title: item.title,
      propertyAddress: item.property_address || item.propertyAddress,
      propertyImageUrl: item.property_image_url || item.propertyImageUrl,
      monthlyIncome: item.monthly_income || item.monthlyIncome,
      moveInDate: item.move_in_date || item.moveInDate,
      leaseTermMonths: item.lease_term_months || item.leaseTermMonths,
      status: item.status,
      note: item.note,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
    })) as TenantApplication[];
  },

  softDeleteApplication: async (id: string) => {
    return await http.delete<void>(`${BASE_URL}/${id}`);
  },
};
