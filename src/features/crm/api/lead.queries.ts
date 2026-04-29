import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi } from './lead.api';
import { leadKeys, type LeadListFilters, type LeadSummaryFilters } from './keys';
import type {
  CreateLeadRequest,
  UpdateLeadRequest,
  UpdateLeadStatusRequest,
  AddLeadNoteRequest,
} from '../types/api';

export function useLeads(filters: LeadListFilters = {}) {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => leadApi.getLeads({ size: 100, ...filters }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useLeadSummary(filters: LeadSummaryFilters = {}) {
  return useQuery({
    queryKey: leadKeys.summary(filters),
    queryFn: () => leadApi.getSummary(filters),
    placeholderData: keepPreviousData,
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
