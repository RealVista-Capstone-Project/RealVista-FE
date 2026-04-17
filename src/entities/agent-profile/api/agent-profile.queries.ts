import { queryOptions } from '@tanstack/react-query';
import { agentProfileApi } from './agent-profile.api';
import { agentProfileKeys } from './keys';

export const agentProfileQueries = {
  me: () =>
    queryOptions({
      queryKey: agentProfileKeys.me(),
      queryFn: () => agentProfileApi.getMine(),
      staleTime: 2 * 60 * 1000,
      retry: 1,
    }),

  listForProperty: (params?: { propertyId?: string; search?: string; minRating?: number }) =>
    queryOptions({
      queryKey: agentProfileKeys.list(params),
      queryFn: async () => {
        const res = await agentProfileApi.listAgents(params);
        return res.payload.data;
      },
      staleTime: 2 * 60 * 1000,
    }),

  reviewsForAgent: (agentId: string) =>
    queryOptions({
      queryKey: agentProfileKeys.reviews(agentId),
      queryFn: async () => {
        const res = await agentProfileApi.getAgentReviews(agentId);
        return res.payload.data;
      },
      staleTime: 2 * 60 * 1000,
      enabled: !!agentId,
    }),
} as const;
