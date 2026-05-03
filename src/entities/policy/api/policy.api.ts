import http from '@/shared/lib/http';
import { ApiResponse } from '@/shared/types/api';

export interface Policy {
  policy_id: string;
  title: string;
  slug: string;
  content: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export const policyApi = {
  getAllPolicies: () => http.get<ApiResponse<Policy[]>>('/admin/policies'),

  getPolicyById: (id: string) => http.get<ApiResponse<Policy>>(`/admin/policies/${id}`),

  createPolicy: (data: Partial<Policy>) => http.post<ApiResponse<Policy>>('/admin/policies', data),

  updatePolicy: (id: string, data: Partial<Policy>) => http.put<ApiResponse<Policy>>(`/admin/policies/${id}`, data),

  deletePolicy: (id: string) => http.delete<ApiResponse<void>>(`/admin/policies/${id}`),

  activatePolicy: (id: string) => http.post<ApiResponse<Policy>>(`/admin/policies/${id}/toggle-status`, {}),
  deactivatePolicy: (id: string) => http.post<ApiResponse<Policy>>(`/admin/policies/${id}/toggle-status`, {}),
};
