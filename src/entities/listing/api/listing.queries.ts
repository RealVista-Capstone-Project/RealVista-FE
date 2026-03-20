import { queryOptions } from '@tanstack/react-query';
import { listingApi } from './index';
import { listingKeys } from './keys';

/**
 * Listing Query Factory
 * TanStack Query v5 queryOptions for type-safe queries
 * Uses listingKeys from keys.ts for consistent query key management
 */
export const listingQueries = {
  /**
   * Get single listing by ID
   */
  detail: (listingId: string) =>
    queryOptions({
      queryKey: listingKeys.detail(listingId),
      queryFn: () => listingApi.getById(listingId),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!listingId,
    }),

  /**
   * Get price history for a listing
   */
  priceHistory: (listingId: string) =>
    queryOptions({
      queryKey: listingKeys.priceHistory(listingId),
      queryFn: () => listingApi.getPriceHistory(listingId),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!listingId,
    }),

  /**
   * Get similar listings by listing ID
   */
  similar: (listingId: string, limit: number = 3) =>
    queryOptions({
      queryKey: listingKeys.similar(listingId, limit),
      queryFn: () => listingApi.getSimilar(listingId, limit),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!listingId,
    }),

  /**
   * Get managed listings (listings created by the authenticated user)
   * Requires authentication
   */
  managed: () =>
    queryOptions({
      queryKey: listingKeys.managed(),
      queryFn: async () => {
        const response = await listingApi.getManagedListings();
        return response.payload.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),
} as const;
