import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api';
import type { AgentListItem, AgentProfile, AgentReview, UpdateAgentProfilePayload } from '../model/types';

export const agentProfileApi = {
  getMine: () => http.get<ApiResponse<AgentProfile>>('/me/agent-profile'),
  updateMine: (data: UpdateAgentProfilePayload) =>
    http.patch<ApiResponse<AgentProfile>>('/me/agent-profile', data),
  listAgents: (params?: { propertyId?: string; search?: string; minRating?: number }) => {
    const q = new URLSearchParams();
    if (params?.propertyId) q.append('property_id', params.propertyId);
    if (params?.search) q.append('search', params.search);
    if (params?.minRating != null) q.append('min_rating', params.minRating.toString());
    const qs = q.toString();
    return http.get<ApiResponse<AgentListItem[]>>(`/agents${qs ? `?${qs}` : ''}`);
  },
  getAgentReviews: (agentId: string) =>
    http.get<ApiResponse<AgentReview[]>>(`/agents/${agentId}/reviews`),
} as const;
