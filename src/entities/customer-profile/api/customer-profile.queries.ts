import { queryOptions } from '@tanstack/react-query'
import { customerProfileApi } from './customer-profile.api'
import { customerProfileKeys } from './keys'

export const customerProfileQueries = {
  me: () =>
    queryOptions({
      queryKey: customerProfileKeys.me(),
      queryFn: () => customerProfileApi.getAll(),
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }),
} as const
