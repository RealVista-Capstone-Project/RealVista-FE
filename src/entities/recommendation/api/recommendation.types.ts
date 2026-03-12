/**
 * Recommendation API Types
 * TypeScript types for recommendation API requests and responses
 */

export type BehaviorEventType = 'VIEW' | 'CLICK' | 'BOOKMARK' | 'SEARCH' | 'INQUIRY' | 'SHARE';

export interface BehaviorEvent {
  event_type: BehaviorEventType;
  listing_id: string;
  duration_seconds?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface IngestBehaviorRequest {
  user_id?: string; // Will be overridden by backend with authenticated user
  events: BehaviorEvent[];
}

export interface IngestBehaviorResponse {
  message: string;
  data: {
    ingested: boolean;
    event_count: number;
    threshold_met: boolean;
  };
}

export interface RecommendedListing {
  listing_id: string;
  reason: string;
  score: number;
  name: string;
  slug: string;
  listing_type: 'SALE' | 'RENT';
  price: number;
  thumbnail: string;
  location: string;
}

export interface RecommendationResponse {
  message: string;
  data: {
    user_id: string;
    recommendations: RecommendedListing[];
    generated_at: string;
    behavior_summary: string;
    from_cache: boolean;
  };
}

export interface RecommendationStatusResponse {
  message: string;
  data: {
    user_id: string;
    event_count: number;
    threshold_met: boolean;
  };
}
