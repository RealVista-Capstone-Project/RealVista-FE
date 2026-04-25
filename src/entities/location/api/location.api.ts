import http from '@/shared/lib/http';
import type {
  ApiResponse,
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  AdminLocationListParams,
} from './location-api.types';
import type { PageResponse } from '@/shared/types/search';

export const locationApi = {
  getCities: () => {
    return http.get<ApiResponse<LocationResponse[]>>('locations/cities', {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  getDistricts: () => {
    return http.get<ApiResponse<LocationResponse[]>>('locations/districts', {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  getChildrenLocations: (parentId: string) => {
    return http.get<ApiResponse<LocationResponse[]>>(`locations/${parentId}/children`, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  searchByCoordinates: (lat: number, lng: number) => {
    return http.get<ApiResponse<LocationResponse>>(`locations/search?lat=${lat}&lng=${lng}`, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  // Admin CRUD
  adminList: (params?: AdminLocationListParams) => {
    const query = new URLSearchParams();
    if (params?.level) query.append('level', params.level);
    if (params?.parent_id) query.append('parentId', params.parent_id);
    if (params?.search) query.append('search', params.search);
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    const qs = query.toString();
    return http.get<ApiResponse<PageResponse<LocationResponse>>>(
      `admin/locations${qs ? `?${qs}` : ''}`,
      { baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT }
    );
  },

  createLocation: (req: CreateLocationRequest) => {
    return http.post<ApiResponse<LocationResponse>>('admin/locations', req, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  updateLocation: (id: string, req: UpdateLocationRequest) => {
    return http.put<ApiResponse<LocationResponse>>(`admin/locations/${id}`, req, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },
};
