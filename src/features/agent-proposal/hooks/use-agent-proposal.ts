import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { agentProposalApi } from '@/entities/agent-proposal/api';
import { agentProposalKeys } from '@/entities/agent-proposal/api/keys';
import { ApplyAgentProposalPayload } from '@/entities/agent-proposal/model/types';
import { handleErrorApi } from '@/shared/lib/utils/handle-error';

export const useMyProposalsQuery = (page: number, size: number) => {
  return useQuery({
    queryKey: agentProposalKeys.myProposals(page, size),
    queryFn: () => agentProposalApi.getMyProposals(page, size),
  });
};

export const useApplyProposalMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: agentProposalApi.applyProposal,
    onSuccess: () => {
      toast.success(t('ManageProposals.toastCreateSuccess'));
      queryClient.invalidateQueries({ queryKey: agentProposalKeys.all });
      onSuccessCallback?.();
    },
    onError: (error: any) => {
      handleErrorApi({ error, t });
    },
  });
};

export const useCancelProposalMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: agentProposalApi.cancelProposal,
    onSuccess: () => {
      toast.success(t('ManageProposals.toastDeleteSuccess'));
      queryClient.invalidateQueries({ queryKey: agentProposalKeys.all });
      onSuccessCallback?.();
    },
    onError: (error: any) => handleErrorApi({ error, t }),
  });
};

export const useUpdateProposalMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApplyAgentProposalPayload }) =>
      agentProposalApi.updateProposal(id, payload),
    onSuccess: () => {
      toast.success(t('ManageProposals.toastUpdateSuccess'));
      queryClient.invalidateQueries({ queryKey: agentProposalKeys.all });
      onSuccessCallback?.();
    },
    onError: (error: any) => {
      handleErrorApi({ error, t });
    },
  });
};

/** POST (create) or PUT (edit) with {@link ApplyAgentProposalPayload.status} DRAFT. */
export const useSaveProposalDraftMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: string;
      payload: ApplyAgentProposalPayload;
    }) => {
      if (id) return agentProposalApi.updateProposal(id, payload);
      return agentProposalApi.applyProposal(payload);
    },
    onSuccess: () => {
      toast.success(t('ManageProposals.toastDraftSaved'));
      queryClient.invalidateQueries({ queryKey: agentProposalKeys.all });
      onSuccessCallback?.();
    },
    onError: (error: any) => {
      handleErrorApi({ error, t });
    },
  });
};
