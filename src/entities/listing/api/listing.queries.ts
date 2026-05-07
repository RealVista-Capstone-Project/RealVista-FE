import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { listingApi } from './index';
import { listingKeys } from './keys';
import type { PageResponse } from '@/entities/listing/model/types';
import type { ManagedListing } from '@/screens/dashboard/managed-listings/types/managed-listing';

/**
 * Listing Query Factory
 * TanStack Query v5 queryOptions for type-safe queries
 * Uses listingKeys from keys.ts for consistent query key management
 */
export const listingQueries = {
  /**
   * Get single listing by ID
   */
  detail: (listingId: string, recordView: boolean = false, editing: boolean = false) =>
    queryOptions({
      queryKey: [...listingKeys.detail(listingId), recordView, editing],
      queryFn: () => listingApi.getById(listingId, recordView, editing),
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
      staleTime: 0,
    }),

  /**
   * Managed listings for infinite scroll (accumulate pages in the UI).
   */
  managedInfinite: (params?: {
    size?: number;
    search?: string;
    listingType?: string;
    status?: string;
    sortBy?: string;
    createdBy?: string;
  }) =>
    infiniteQueryOptions({
      queryKey: [...listingKeys.managedInfiniteLists(), params ?? {}] as const,
      queryFn: async ({ pageParam }) => {
        const response = await listingApi.getManagedListings({
          ...params,
          page: pageParam as number,
          size: params?.size ?? 10,
        });
        return response.payload.data;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage: PageResponse<ManagedListing>) =>
        lastPage.last ? undefined : lastPage.page + 1,
      staleTime: 0,
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
      staleTime: 0,
    }),

  /**
   * Get listings by property ID
   */
  byProperty: (propertyId: string, size: number = 10) =>
    queryOptions({
      queryKey: listingKeys.byProperty(propertyId, size),
      queryFn: async () => {
        const response = await listingApi.getManagedListings({ propertyId, size });
        return response.payload.data;
      },
      staleTime: 2 * 60 * 1000,
      enabled: !!propertyId,
    }),

  /**
   * Get related listings by property ID
   * Returns RENT and SALE listings for the same property (if both exist and are active)
   */
  relatedByProperty: (propertyId: string) =>
    queryOptions({
      queryKey: listingKeys.relatedByProperty(propertyId),
      queryFn: async () => {
        const response = await listingApi.getRelatedByProperty(propertyId);
        return response.payload.data;
      },
      staleTime: 5 * 60 * 1000,
      enabled: !!propertyId,
    }),

  /**
   * Get compare data for multiple listings
   * Returns comprehensive data for comparison including attributes, amenities, and boost status
   */
  compare: (listingIds: string[]) =>
    queryOptions({
      queryKey: listingKeys.compare(listingIds),
      queryFn: async () => {
        const response = await listingApi.getCompareData(listingIds);
        return response.payload.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled: listingIds.length > 0 && listingIds.length <= 3,
    }),
};
