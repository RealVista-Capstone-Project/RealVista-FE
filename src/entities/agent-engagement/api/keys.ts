import type { GetAgentEngagementsParams } from '../model/types';

export const agentEngagementKeys = {
  all: ['agent-engagements'] as const,
  lists: () => [...agentEngagementKeys.all, 'list'] as const,
  list: (params: GetAgentEngagementsParams) =>
    [...agentEngagementKeys.lists(), params] as const,
} as const;
