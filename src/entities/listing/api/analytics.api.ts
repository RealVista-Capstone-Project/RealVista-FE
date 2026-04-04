import http from '@/shared/lib/http';
import type { ApiResponse } from '../model/types';
import type { ListingAnalytics } from '../model/analytics.types';

/**
 * Listing Analytics API
 * HTTP methods for fetching listing performance metrics
 */
export const listingAnalyticsApi = {
  /**
   * Get analytics metrics for a listing
   * Returns total views, unique viewers, tour bookings, and conversion rate
   * Only accessible by the listing owner
   */
  getAnalytics: (listingId: string) =>
    http.get<ApiResponse<ListingAnalytics>>(`/listings/${listingId}/analytics`),
} as const;
