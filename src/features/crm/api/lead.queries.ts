import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi } from './lead.api';
import { leadKeys } from './keys';
import { LeadStatus } from '../types/lead';
import type {
  CreateLeadRequest,
  UpdateLeadRequest,
  UpdateLeadStatusRequest,
  AddLeadNoteRequest,
} from '../types/api';

export function useLeads(status?: LeadStatus) {
  return useQuery({
    queryKey: leadKeys.list(status),
    queryFn: () => leadApi.getLeads({ status, size: 100 }),
    staleTime: 30 * 1000,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadRequest) => leadApi.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: UpdateLeadRequest }) =>
      leadApi.updateLead(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: UpdateLeadStatusRequest }) =>
      leadApi.updateLeadStatus(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => leadApi.deleteLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

export function useAddLeadNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: AddLeadNoteRequest }) =>
      leadApi.addNote(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}
