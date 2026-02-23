import http from '@/shared/lib/http';
import type {
  Listing,
  ApiResponse,
  SimilarListingsResponse,
} from '../model/types';

/**
 * Listing API - All listing-related HTTP methods
 * This is the data source layer - pure functions that make HTTP requests
 */
export const listingApi = {
  /**
   * Get listing by ID (slug or listing_id)
   * Returns the full API response with success, message, data, and timestamp
   */
  getById: (listingId: string) =>
    http.get<ApiResponse<Listing>>(`/listings/${listingId}`),

  /**
   * Get similar listings by listing ID
   * Returns paginated similar listings
   */
  getSimilar: (listingId: string, limit: number = 5) =>
    http.get<ApiResponse<SimilarListingsResponse>>(
      `/listings/${listingId}/similar?limit=${limit}`
    ),
} as const;

// Re-export query keys and queries
export { listingKeys } from './keys';
export { listingQueries } from './listing.queries';
