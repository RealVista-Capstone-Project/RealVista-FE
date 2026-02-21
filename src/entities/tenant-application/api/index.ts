import http from '@/shared/lib/http';
import { TenantApplication } from '../model/types';
import { ApiResponse } from '@/shared/types/api-response';
import { mapToTenantApplication } from '../lib/tenant-application.mapper';

const BASE_URL = '/tenant-applications';

export const tenantApplicationApi = {
  getMyApplications: async () => {
    const response = await http.get<ApiResponse<any[]>>(BASE_URL);
    return response.payload.data.map(mapToTenantApplication);
  },

  softDeleteApplication: async (id: string) => {
    return await http.delete<void>(`${BASE_URL}/${id}`);
  },
};
