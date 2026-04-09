import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentProposalApi } from '../model/api';
import type { SubmitProposalPayload } from '../model/types';

export function useSubmitProposalMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitProposalPayload) => agentProposalApi.submitProposal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'owner-available'] });
      onSuccess?.();
    },
  });
}
