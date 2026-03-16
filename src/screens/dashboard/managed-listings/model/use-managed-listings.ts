import { useQuery } from '@tanstack/react-query';
import http from '@/shared/lib/http/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type { ManagedListing } from '../types/managed-listing';

export function useManagedListings() {
  return useQuery<ManagedListing[]>({
    queryKey: ['managed-listings'],
    queryFn: async () => {
      const response = await http.get<ApiResponse<ManagedListing[]>>('/listings/managed-listings');
      return response.payload.data;
    },
  });
}
