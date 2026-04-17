import http from '@/shared/lib/http';
import type { RecommendationApiResponse, BehaviorApiResponse } from '../model/types';

/**
 * Recommendation API Client
 *
 * Endpoints:
 * - GET /api/v1/recommendations?limit={n} — Get personalized recommendations
 * - POST /api/v1/recommendations/refresh?limit={n} — Force refresh
 * - GET /api/v1/recommendations/status — Get metrics threshold status
 */
export const recommendationApi = {
  /**
   * Get personalized recommendations for the authenticated user.
   * Uses cached results when below metrics threshold,
   * or generates fresh ones when threshold is met.
   */
  getRecommendations(limit: number = 6, listingType?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (listingType) params.append('listing_type', listingType);
    return http.get<RecommendationApiResponse>(`/recommendations?${params.toString()}`);
  },

  /**
   * Force-refresh recommendations.
   * Bypasses threshold check and calls AI service directly.
   * Evicts cache for this user.
   */
  refreshRecommendations(limit: number = 6, listingType?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (listingType) params.append('listing_type', listingType);
    return http.post<RecommendationApiResponse>(
      `/recommendations/refresh?${params.toString()}`,
      {}
    );
  },

  /**
   * Get recommendation status.
   * Returns whether metrics threshold has been reached
   * and current event count for the user.
   */
  getStatus() {
    return http.get<BehaviorApiResponse>('/recommendations/status');
  },
};
