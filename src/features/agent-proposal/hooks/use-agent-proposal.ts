import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agentProposalApi } from '@/entities/agent-proposal/api';
import { agentProposalKeys } from '@/entities/agent-proposal/api/keys';

export const useMyProposalsQuery = (page: number, size: number) => {
    return useQuery({
        queryKey: agentProposalKeys.myProposals(page, size),
        queryFn: () => agentProposalApi.getMyProposals(page, size),
    });
};

export const useApplyProposalMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: agentProposalApi.applyProposal,
        onSuccess: () => {
            toast.success('Successfully submitted your proposal!');
            queryClient.invalidateQueries({ queryKey: agentProposalKeys.all });
            if (onSuccessCallback) {
                onSuccessCallback();
            }
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to submit proposal';
            toast.error(message);
        },
    });
};

export const useCancelProposalMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: agentProposalApi.cancelProposal,
        onSuccess: () => {
            toast.success('Proposal successfully cancelled.');
            queryClient.invalidateQueries({ queryKey: agentProposalKeys.all });
            if (onSuccessCallback) {
                onSuccessCallback();
            }
        },
        onError: () => toast.error('Failed to cancel proposal.'),
    });
};
