import { useQuery } from '@tanstack/react-query';
import { listingAnalyticsQueries } from '@/entities/listing';

/**
 * Hook to fetch listing analytics metrics
 * @param listingId - The listing ID to fetch analytics for
 * @returns TanStack Query result with analytics data
 */
export function useListingAnalytics(listingId: string) {
  return useQuery(listingAnalyticsQueries.byListingId(listingId));
}
