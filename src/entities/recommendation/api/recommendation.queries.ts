import { queryOptions } from '@tanstack/react-query';
import { recommendationApi } from './recommendation.api';
import { recommendationKeys } from './keys';

/**
 * Recommendation Query Factory
 * TanStack Query v5 queryOptions for type-safe queries
 */
export const recommendationQueries = {
  /**
   * Get personalized recommendations for the current user.
   * Shorter stale time than listings since recommendations are more dynamic.
   */
  forUser: (limit: number = 6, listingType?: string) =>
    queryOptions({
      queryKey: recommendationKeys.forUser(limit, listingType),
      queryFn: () => recommendationApi.getRecommendations(limit, listingType),
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 1,
    }),

  /**
   * Get recommendation status (threshold reached, event count).
   */
  status: () =>
    queryOptions({
      queryKey: recommendationKeys.status(),
      queryFn: () => recommendationApi.getStatus(),
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
    }),
} as const;
