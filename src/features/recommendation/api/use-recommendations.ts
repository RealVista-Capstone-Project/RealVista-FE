import { useQuery } from '@tanstack/react-query';
import { recommendationQueries } from '@/entities/recommendation';

/**
 * Hook to get personalized recommendations for current user
 * @param limit - Maximum number of recommendations to return (default: 10)
 */
export function useRecommendations(limit?: number) {
  return useQuery(recommendationQueries.list(limit));
}
