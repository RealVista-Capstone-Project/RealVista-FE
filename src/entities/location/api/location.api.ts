import http from '@/shared/lib/http';
import type { ApiResponse, LocationResponse } from './location-api.types';

export const locationApi = {
  getCities: () => {
    return http.get<ApiResponse<LocationResponse[]>>('locations/cities', {
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
};
