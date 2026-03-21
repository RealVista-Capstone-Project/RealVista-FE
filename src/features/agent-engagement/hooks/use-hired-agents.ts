import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentEngagementQueries, agentEngagementKeys, agentEngagementApi } from '@/entities/agent-engagement';
import type { GetAgentEngagementsParams, CreateReviewPayload } from '@/entities/agent-engagement';

export function useHiredAgentsQuery(params: GetAgentEngagementsParams = {}) {
  return useQuery(agentEngagementQueries.list(params));
}

export function useFinishEngagementMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (engagementId: string) => agentEngagementApi.finishEngagement(engagementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentEngagementKeys.lists() });
      onSuccess?.();
    },
  });
}

export function useCancelEngagementMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ engagementId, reason }: { engagementId: string; reason: string }) =>
      agentEngagementApi.cancelEngagement(engagementId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentEngagementKeys.lists() });
      onSuccess?.();
    },
  });
}

export function useSubmitReviewMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => agentEngagementApi.submitReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentEngagementKeys.lists() });
      onSuccess?.();
    },
  });
}
