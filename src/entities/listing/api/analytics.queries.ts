import { queryOptions } from '@tanstack/react-query';
import { listingAnalyticsApi } from './analytics.api';

/**
 * TanStack Query options for listing analytics
 * Provides type-safe query configuration for analytics data fetching
 */
export const listingAnalyticsQueries = {
  /**
   * Query options for fetching analytics by listing ID
   * @param listingId - The listing ID to fetch analytics for
   * @returns Query options with 5-minute stale time
   */
  byListingId: (listingId: string) =>
    queryOptions({
      queryKey: ['listing-analytics', listingId],
      queryFn: async () => {
        const { payload } = await listingAnalyticsApi.getAnalytics(listingId);
        return payload.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }),
} as const;
