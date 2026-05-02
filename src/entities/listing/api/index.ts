import http from '@/shared/lib/http';
import type {
  Listing,
  ApiResponse,
  PriceHistory,
  SimilarListingsResponse,
  PageResponse,
  ManagedListingSummary,
} from '../model/types';
import type { ManagedListing } from '@/screens/dashboard/managed-listings/types/managed-listing';

/**
 * Listing API - All listing-related HTTP methods
 * This is the data source layer - pure functions that make HTTP requests
 */
export const listingApi = {
  getById: (
    listingId: string,
    recordView: boolean = false,
    options?: Parameters<typeof http.get<ApiResponse<Listing>>>[1]
  ) =>
    http.get<ApiResponse<Listing>>(`/listings/${listingId}?recordView=${recordView}`, {
      next: { tags: ['listing-detail', listingId] },
      ...options,
      headers: {
        ...options?.headers,
      },
    }),

  /**
   * Get price history for a listing
   * Returns the price history with all price changes including calculated differences and percentages
   */
  getPriceHistory: (listingId: string) =>
    http.get<ApiResponse<PriceHistory>>(`/listings/${listingId}/price-history`),

  /**
   * Get similar listings by listing ID
   * Returns paginated similar listings
   */
  getSimilar: (listingId: string, limit: number = 5) =>
    http.get<ApiResponse<SimilarListingsResponse>>(`/listings/${listingId}/similar?limit=${limit}`),

  /**
   * Get managed listings (listings created by the authenticated user)
   * Returns a paginated list of listings
   * Requires authentication
   */
  getManagedListings: (params?: {
    page?: number;
    size?: number;
    search?: string;
    listingType?: string;
    status?: string;
    sortBy?: string;
    propertyId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.listingType) query.append('listingType', params.listingType);
    if (params?.status) query.append('status', params.status);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.propertyId) query.append('propertyId', params.propertyId);

    const queryString = query.toString();
    return http.get<ApiResponse<PageResponse<ManagedListing>>>(
      `/listings/managed-listings${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get managed listings summary (counts by type)
   * Requires authentication
   */
  getManagedListingSummary: () =>
    http.get<ApiResponse<ManagedListingSummary>>('/listings/managed-listings/summary'),

  // ==================== Status Update Operations ====================

  /**
   * Publish listing (DRAFT/PENDING → PUBLISHED)
   */
  publish: (listingId: string) =>
    http.patch<ApiResponse<unknown>>(`/listings/${listingId}/publish`, undefined),

  /**
   * Unpublish listing (PUBLISHED → DRAFT)
   */
  unpublish: (listingId: string) =>
    http.patch<ApiResponse<unknown>>(`/listings/${listingId}/unpublish`, undefined),

  /**
   * Mark SALE listing as sold (PUBLISHED → SOLD)
   */
  markAsSold: (listingId: string) =>
    http.patch<ApiResponse<unknown>>(`/listings/${listingId}/mark-as-sold`, undefined),

  /**
   * Mark RENT listing as rented (PUBLISHED → RENTED)
   */
  markAsRented: (listingId: string) =>
    http.patch<ApiResponse<unknown>>(`/listings/${listingId}/mark-as-rented`, undefined),

  /**
   * Create a new listing (DRAFT status)
   * Requires authentication
   */
  createListing: (data: Record<string, unknown>) =>
    http.post<ApiResponse<unknown>>('/listings', data),

  /**
   * Update an existing listing (name, price, content, media)
   * Requires authentication and ownership
   */
  updateListing: (listingId: string, data: Record<string, unknown>) =>
    http.put<ApiResponse<unknown>>(`/listings/${listingId}`, data),

  /**
   * Delete a listing (soft delete)
   * Requires authentication and ownership
   */
  deleteListing: (listingId: string) => http.delete<ApiResponse<void>>(`/listings/${listingId}`),
} as const;

// Re-export query keys, queries, and actions
export { listingKeys } from './keys';
export { listingQueries } from './listing.queries';
export * from './actions';
export { listingBoostApi } from './listing-boost.api';
export {
  listingBoostKeys,
  listingBoostQueries,
  useApplyBoost,
  useRemoveBoost,
} from './listing-boost.queries';
