import { useQuery } from '@tanstack/react-query';
import { listingQueries } from '@/entities/listing/api';

/**
 * usePriceHistory Hook
 * Fetches price history for a listing using TanStack Query
 *
 * @param listingId - The ID of the listing to fetch price history for
 *
 * @example
 * const { data, isLoading, error } = usePriceHistory('listing-uuid')
 *
 * // Access the price history data
 * const priceHistory = data?.payload?.data?.price_history
 * const currentPrice = data?.payload?.data?.current_price
 */
export function usePriceHistory(listingId: string) {
  return useQuery(listingQueries.priceHistory(listingId));
}
