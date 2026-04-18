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
  detail: (listingId: string, recordView: boolean = false) =>
    queryOptions({
      queryKey: [...listingKeys.detail(listingId), recordView],
      queryFn: () => listingApi.getById(listingId, recordView),
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
  managed: (params?: {
    page?: number;
    size?: number;
    search?: string;
    listingType?: string;
    status?: string;
    sortBy?: string;
  }) =>
    queryOptions({
      queryKey: listingKeys.managed(params),
      queryFn: async () => {
        const response = await listingApi.getManagedListings(params);
        return response.payload.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),

  /**
   * Get summary counts for managed listings
   */
  managedSummary: () =>
    queryOptions({
      queryKey: listingKeys.managedSummary(),
      queryFn: async () => {
        const response = await listingApi.getManagedListingSummary();
        return response.payload.data;
      },
      staleTime: 5 * 60 * 1000,
    }),

  /**
   * Get listings by property ID
   */
  byProperty: (propertyId: string) =>
    queryOptions({
      queryKey: [...listingKeys.all, 'by-property', propertyId] as const,
      queryFn: async () => {
        const response = await listingApi.getManagedListings({ propertyId, size: 50 });
        return response.payload.data;
      },
      staleTime: 2 * 60 * 1000,
      enabled: !!propertyId,
    }),
};
