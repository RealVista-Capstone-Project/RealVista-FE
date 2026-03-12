/**
 * Recommendation Query Keys
 * Centralized query keys for TanStack Query
 * Provides type-safe query keys for invalidation and caching
 */
export const recommendationKeys = {
  // Base key for all recommendation queries
  all: ['recommendations'] as const,

  // Get recommendations for current user
  list: (limit?: number) => [...recommendationKeys.all, 'list', limit] as const,

  // Get recommendation status
  status: () => [...recommendationKeys.all, 'status'] as const,
} as const;
