import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationApi, recommendationKeys } from '@/entities/recommendation';

/**
 * Hook to ingest user behavior events
 * Invalidates recommendations cache after successful ingestion
 */
export function useIngestBehavior() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recommendationApi.ingestBehavior,
    onSuccess: () => {
      // Invalidate recommendations and status after behavior ingestion
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all });
    },
  });
}
