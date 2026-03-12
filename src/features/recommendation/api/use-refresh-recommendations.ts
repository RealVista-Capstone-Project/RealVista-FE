import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationApi, recommendationKeys } from '@/entities/recommendation';

/**
 * Hook to force refresh recommendations
 * Bypasses cache and generates fresh recommendations from AI
 */
export function useRefreshRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limit?: number) => recommendationApi.refreshRecommendations(limit),
    onSuccess: () => {
      // Invalidate recommendations cache after refresh
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all });
    },
  });
}
