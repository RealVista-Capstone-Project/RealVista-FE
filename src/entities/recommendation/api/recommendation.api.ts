import http from '@/shared/lib/http';
import type {
  IngestBehaviorRequest,
  IngestBehaviorResponse,
  RecommendationResponse,
  RecommendationStatusResponse,
} from './recommendation.types';

/**
 * Recommendation API Client
 * HTTP client for AI-powered recommendation endpoints
 */
export const recommendationApi = {
  /**
   * Ingest user behavior events
   * POST /api/v1/recommendations/behavior
   */
  async ingestBehavior(request: IngestBehaviorRequest): Promise<IngestBehaviorResponse> {
    const response = await http.post<IngestBehaviorResponse>(
      '/api/v1/recommendations/behavior',
      request
    );
    return response.payload;
  },

  /**
   * Get personalized recommendations for authenticated user
   * GET /api/v1/recommendations?limit=10
   */
  async getRecommendations(limit?: number): Promise<RecommendationResponse> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await http.get<RecommendationResponse>(
      `/api/v1/recommendations${params}`
    );
    return response.payload;
  },

  /**
   * Force refresh recommendations
   * POST /api/v1/recommendations/refresh?limit=10
   */
  async refreshRecommendations(limit?: number): Promise<RecommendationResponse> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await http.post<RecommendationResponse>(
      `/api/v1/recommendations/refresh${params}`,
      {}
    );
    return response.payload;
  },

  /**
   * Get recommendation status (event count and threshold status)
   * GET /api/v1/recommendations/status
   */
  async getStatus(): Promise<RecommendationStatusResponse> {
    const response = await http.get<RecommendationStatusResponse>(
      '/api/v1/recommendations/status'
    );
    return response.payload;
  },
} as const;
