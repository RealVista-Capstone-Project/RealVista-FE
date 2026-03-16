import { useQuery } from '@tanstack/react-query';
import http from '@/shared/lib/http/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type { ListingDetail } from '../types/listing-detail';

export function useListingDetail(listingId: string | null) {
  return useQuery<ListingDetail>({
    queryKey: ['listing-detail', listingId],
    queryFn: async () => {
      if (!listingId) throw new Error('Listing ID is required');
      const response = await http.get<ApiResponse<ListingDetail>>(`/listings/${listingId}`);
      return response.payload.data;
    },
    enabled: !!listingId,
  });
}
