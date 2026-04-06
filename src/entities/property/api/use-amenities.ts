import { useQuery } from '@tanstack/react-query';
import http from '@/shared/lib/http';
import { ApiResponse } from './property-api.types';

export interface PropertyApiAmenity {
  amenity_id: string;
  amenity_name: string;
  amenity_type: string;
  description?: string;
  is_onsite?: boolean;
  is_offsite?: boolean;
}

export const useAmenities = () => {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: async () => {
      const { payload } = await http.get<ApiResponse<PropertyApiAmenity[]>>(
        'properties/amenities',
        {
          baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
        }
      );
      return payload.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours caching since it rarely changes
  });
};
