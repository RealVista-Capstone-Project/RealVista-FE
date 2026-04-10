import http from '@/shared/lib/http';
import type { ListingBoostResponse } from '../model/listing-boost.types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const listingBoostApi = {
  getBoosts: (listingId: string) =>
    http.get<ApiResponse<ListingBoostResponse[]>>(`/listings/${listingId}/boosts`),

  applyBoost: (listingId: string, boostType: 'FEATURED' | 'HOT_BADGE') =>
    http.post<ApiResponse<ListingBoostResponse>>(`/listings/${listingId}/boosts`, {
      boost_type: boostType,
    }),

  removeBoost: (listingId: string, boostType: 'FEATURED' | 'HOT_BADGE') =>
    http.delete<ApiResponse<void>>(`/listings/${listingId}/boosts/${boostType}`),
};
