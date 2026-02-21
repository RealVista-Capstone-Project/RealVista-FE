import http from '@/shared/lib/http';
import { TenantRentalProfile } from '../model/types';
import { ApiResponse } from '@/shared/types/api-response';
import { mapToTenantApplication } from '../lib/tenant-application.mapper';
import { mapToTenantRentalProfile } from '../lib/tenant-rental-profile.mapper';

const BASE_URL = '/tenant-applications';

export const tenantApplicationApi = {
  getMyApplications: async () => {
    const response = await http.get<ApiResponse<any[]>>(BASE_URL);
    return response.payload.data.map(mapToTenantApplication);
  },

  softDeleteApplication: async (id: string) => {
    return await http.delete<void>(`${BASE_URL}/${id}`);
  },

  submitApplication: async (listingId: string, profileId: string) => {
    const response = await http.post<ApiResponse<any>>(`${BASE_URL}/listings/${listingId}/profiles/${profileId}`, {});
    return mapToTenantApplication(response.payload.data);
  }
};

export const tenantRentalProfileApi = {
  getMyProfiles: async () => {
    const response = await http.get<ApiResponse<TenantRentalProfile[]>>('/tenant-rental-profiles');
    return response.payload.data.map(mapToTenantRentalProfile);
  },

  createProfile: async (profile: Omit<TenantRentalProfile, 'profileId' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>) => {
    const response = await http.post<ApiResponse<TenantRentalProfile>>('/tenant-rental-profiles', profile);
    return mapToTenantRentalProfile(response.payload.data);
  },
};
