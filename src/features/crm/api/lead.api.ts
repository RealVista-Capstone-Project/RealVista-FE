import http from '@/shared/lib/http';
import { ApiResponse } from '@/shared/types';
import { PageResponse } from '@/shared/types/search';
import { LeadStatus } from '../types/lead';
import type {
  LeadResponse,
  LeadNoteResponse,
  CreateLeadRequest,
  UpdateLeadRequest,
  UpdateLeadStatusRequest,
  AddLeadNoteRequest,
} from '../types/api';

export const leadApi = {
  getLeads: async (params: {
    status?: LeadStatus;
    page?: number;
    size?: number;
  }): Promise<PageResponse<LeadResponse>> => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.size !== undefined) searchParams.set('size', String(params.size));

    const qs = searchParams.toString();
    const response = await http.get<ApiResponse<PageResponse<LeadResponse>>>(
      `/crm/leads${qs ? `?${qs}` : ''}`
    );
    return response.payload.data;
  },

  createLead: async (data: CreateLeadRequest): Promise<LeadResponse> => {
    const response = await http.post<ApiResponse<LeadResponse>>('/crm/leads', data);
    return response.payload.data;
  },

  updateLead: async (leadId: string, data: UpdateLeadRequest): Promise<LeadResponse> => {
    const response = await http.put<ApiResponse<LeadResponse>>(`/crm/leads/${leadId}`, data);
    return response.payload.data;
  },

  updateLeadStatus: async (
    leadId: string,
    data: UpdateLeadStatusRequest
  ): Promise<LeadResponse> => {
    const response = await http.patch<ApiResponse<LeadResponse>>(
      `/crm/leads/${leadId}/status`,
      data
    );
    return response.payload.data;
  },

  deleteLead: async (leadId: string): Promise<void> => {
    await http.delete(`/crm/leads/${leadId}`);
  },

  addNote: async (leadId: string, data: AddLeadNoteRequest): Promise<LeadNoteResponse> => {
    const response = await http.post<ApiResponse<LeadNoteResponse>>(
      `/crm/leads/${leadId}/notes`,
      data
    );
    return response.payload.data;
  },
};
