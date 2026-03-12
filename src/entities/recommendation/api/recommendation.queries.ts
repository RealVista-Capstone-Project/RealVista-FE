import { queryOptions } from '@tanstack/react-query';
import { recommendationApi } from './recommendation.api';
import { recommendationKeys } from './keys';

/**
 * Recommendation Query Factory
 * TanStack Query v5 queryOptions for type-safe queries
 * Uses recommendationKeys from keys.ts for consistent query key management
 */
export const recommendationQueries = {
  /**
   * Get personalized recommendations for current user
   */
  list: (limit?: number) =>
    queryOptions({
      queryKey: recommendationKeys.list(limit),
      queryFn: () => recommendationApi.getRecommendations(limit),
      staleTime: 10 * 60 * 1000, // 10 minutes (recommendations are cached)
      retry: 1,
    }),

  /**
   * Get recommendation status (event count and threshold)
   */
  status: () =>
    queryOptions({
      queryKey: recommendationKeys.status(),
      queryFn: () => recommendationApi.getStatus(),
      staleTime: 1 * 60 * 1000, // 1 minute
      retry: 1,
    }),
} as const;
