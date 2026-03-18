import { queryOptions } from '@tanstack/react-query';
import { agentEngagementApi } from './agent-engagement.api';
import { agentEngagementKeys } from './keys';
import type { GetAgentEngagementsParams } from '../model/types';

export const agentEngagementQueries = {
  list: (params: GetAgentEngagementsParams = {}) =>
    queryOptions({
      queryKey: agentEngagementKeys.list(params),
      queryFn: () => agentEngagementApi.getHiredAgents(params),
      staleTime: 2 * 60 * 1000,
    }),
} as const;
