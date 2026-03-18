import { useQuery } from '@tanstack/react-query';
import { agentEngagementQueries } from '@/entities/agent-engagement';
import type { GetAgentEngagementsParams } from '@/entities/agent-engagement';

export function useHiredAgentsQuery(params: GetAgentEngagementsParams = {}) {
  return useQuery(agentEngagementQueries.list(params));
}
