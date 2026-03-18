import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type {
  AgentEngagementPageResponse,
  GetAgentEngagementsParams,
} from '../model/types';

function buildUrl(params: GetAgentEngagementsParams): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params.size !== undefined) {
    searchParams.set('size', String(params.size));
  }
  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }

  const queryString = searchParams.toString();
  return `/engagements/hired-agents${queryString ? `?${queryString}` : ''}`;
}

export const agentEngagementApi = {
  getHiredAgents: (params: GetAgentEngagementsParams = {}) =>
    http.get<ApiResponse<AgentEngagementPageResponse>>(buildUrl(params)),
} as const;
