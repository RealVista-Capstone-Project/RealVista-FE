import http from '@/shared/lib/http'
import type { ApiResponse } from '@/shared/types/api'
import type { CustomerProfile, CreateCustomerProfileData } from '../model/types'

export const customerProfileApi = {
  getAll: () => http.get<ApiResponse<CustomerProfile[]>>('/me/profiles'),
  create: (data: CreateCustomerProfileData) => http.post<ApiResponse<CustomerProfile>>('/me/profiles', data),
  delete: (profileId: string) => http.delete<ApiResponse<void>>(`/me/profiles/${profileId}`),
  switchActive: (profileId: string) => http.put<ApiResponse<CustomerProfile>>(`/me/profiles/${profileId}/switch`, {}),
} as const
