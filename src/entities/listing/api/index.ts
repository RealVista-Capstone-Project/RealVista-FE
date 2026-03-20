import http from '@/shared/lib/http';
import type { Listing, ApiResponse, PriceHistory, SimilarListingsResponse } from '../model/types';
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
   * Returns a simplified list view with flat address structure
   * Requires authentication
   */
  getManagedListings: () => http.get<ApiResponse<ManagedListing[]>>('/listings/managed-listings'),
} as const;

// Re-export query keys and queries
export { listingKeys } from './keys';
export { listingQueries } from './listing.queries';
