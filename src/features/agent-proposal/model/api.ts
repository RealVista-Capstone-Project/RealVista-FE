import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type { SubmitProposalPayload } from '../model/types';

export const agentProposalApi = {
  submitProposal: (payload: SubmitProposalPayload) =>
    http.post<ApiResponse<void>>('/engagements', {
      property_id: payload.property_id,
      message: payload.message,
      offered_commission: payload.offered_commission,
    }),
} as const;
