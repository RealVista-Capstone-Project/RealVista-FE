import http from '@/shared/lib/http';
import type { UserBehaviorRequest, BehaviorApiResponse } from '../model/types';

/**
 * Behavior API Client
 *
 * Sends user behavior events to BE for AI recommendation processing.
 * POST /api/v1/recommendations/behavior
 */
export const behaviorApi = {
  /**
   * Send behavior events to BE.
   * BE forwards these to the AI microservice for Qdrant vector storage.
   */
  sendEvents(request: UserBehaviorRequest) {
    return http.post<BehaviorApiResponse>('/recommendations/behavior', request);
  },
};
