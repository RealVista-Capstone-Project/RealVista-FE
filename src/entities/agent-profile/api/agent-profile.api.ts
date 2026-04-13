import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api';
import type { AgentProfile, UpdateAgentProfilePayload } from '../model/types';

export const agentProfileApi = {
  getMine: () => http.get<ApiResponse<AgentProfile>>('/me/agent-profile'),
  updateMine: (data: UpdateAgentProfilePayload) =>
    http.patch<ApiResponse<AgentProfile>>('/me/agent-profile', data),
} as const;
