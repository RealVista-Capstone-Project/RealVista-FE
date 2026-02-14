import http from '@/shared/lib/http';
import type { Listing, ApiResponse, PriceHistory } from '../model/types';

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
} as const;

// Re-export query keys and queries
export { listingKeys } from './keys';
export { listingQueries } from './listing.queries';
