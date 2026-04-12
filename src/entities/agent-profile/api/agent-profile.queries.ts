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
} as const;
