import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type {
    AgentProposal,
    AgentProposalPageResponse,
    ApplyAgentProposalPayload
} from '../model/types';

const BASE_URL = '/agent-proposals';

export const agentProposalApi = {
    applyProposal: async (payload: ApplyAgentProposalPayload) => {
        const response = await http.post<ApiResponse<AgentProposal>>(BASE_URL, payload);
        return response.payload.data;
    },

    getMyProposals: async (page = 0, size = 10) => {
        const response = await http.get<ApiResponse<AgentProposalPageResponse>>(
            `${BASE_URL}/my-proposals?page=${page}&size=${size}`
        );
        return response.payload.data;
    },

    cancelProposal: async (id: string) => {
        await http.delete<ApiResponse<void>>(`${BASE_URL}/${id}`);
    },

    updateProposal: async (id: string, payload: ApplyAgentProposalPayload) => {
        const response = await http.put<ApiResponse<AgentProposal>>(`${BASE_URL}/${id}`, payload);
        return response.payload.data;
    }
};
