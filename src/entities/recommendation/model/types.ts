/**
 * Recommendation Entity Types
 *
 * Types matching the BE API DTOs from Swagger:
 * - UserBehaviorRequest / BehaviorEvent → POST /api/v1/recommendations/behavior
 * - RecommendationResponse / RecommendedListingDTO → GET /api/v1/recommendations
 */

import type { ApiResponse } from '@/entities/listing';
import type { ListingSearchResponse } from '@/shared/types/search';

// ============ Behavior Events (Request) ============

export interface BehaviorEventDTO {
  event_type: string;
  listing_id: string;
  duration_seconds?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface UserBehaviorRequest {
  user_id: string;
  events: BehaviorEventDTO[];
}

// ============ Recommendations (Response) ============

export interface RecommendedListingDTO extends ListingSearchResponse {
  score: number;
  reason: string;
}

export interface RecommendationResponse {
  recommendations: RecommendedListingDTO[];
  user_id: string;
  generated_at: string;
  behavior_summary: string;
  from_cache: boolean;
}

export type RecommendationApiResponse = ApiResponse<RecommendationResponse>;
export type BehaviorApiResponse = ApiResponse<Record<string, string>>;
