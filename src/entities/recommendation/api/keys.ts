/**
 * Recommendation Query Key Factory
 *
 * Centralized query key management for recommendation-related queries.
 * Follows the same pattern as listingKeys.
 */
export const recommendationKeys = {
  all: ['recommendations'] as const,
  forUser: (limit: number) => [...recommendationKeys.all, 'forUser', limit] as const,
  status: () => [...recommendationKeys.all, 'status'] as const,
};
