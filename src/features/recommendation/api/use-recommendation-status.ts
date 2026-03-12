import { useQuery } from '@tanstack/react-query';
import { recommendationQueries } from '@/entities/recommendation';

/**
 * Hook to get recommendation status (event count and threshold)
 */
export function useRecommendationStatus() {
  return useQuery(recommendationQueries.status());
}
