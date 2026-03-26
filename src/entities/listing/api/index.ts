import http from '@/shared/lib/http';
import type { Listing, ApiResponse, PriceHistory, SimilarListingsResponse, PageResponse, ManagedListingSummary } from '../model/types';
import type { ManagedListing } from '@/screens/dashboard/managed-listings/types/managed-listing';

/**
 * Listing API - All listing-related HTTP methods
 * This is the data source layer - pure functions that make HTTP requests
 */
export const listingApi = {
  /**
   * Get listing by ID (slug or listing_id)
   * Returns the full API response with success, message, data, and timestamp
   */
  getById: (listingId: string) => http.get<ApiResponse<Listing>>(`/listings/${listingId}`),

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
  }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.size !== undefined) query.append('size', params.size.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.listingType) query.append('listingType', params.listingType);
    if (params?.status) query.append('status', params.status);
    if (params?.sortBy) query.append('sortBy', params.sortBy);

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
   * Submit listing for review (DRAFT → PENDING)
   */
  submitForReview: (listingId: string) =>
    http.patch<ApiResponse<unknown>>(`/listings/${listingId}/submit-for-review`, undefined),

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
} as const;

// Re-export query keys and queries
export { listingKeys } from './keys';
export { listingQueries } from './listing.queries';
