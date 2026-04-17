import { queryOptions } from '@tanstack/react-query'
import { customerProfileApi } from './customer-profile.api'
import { customerProfileKeys } from './keys'

export const customerProfileQueries = {
  me: () =>
    queryOptions({
      queryKey: customerProfileKeys.me(),
      queryFn: () => customerProfileApi.getAll(),
      staleTime: 0, // Always fetch fresh profiles when needed to avoid session leakage cache issues
      retry: 1,
    }),
} as const
