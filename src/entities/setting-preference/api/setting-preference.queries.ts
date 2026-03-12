import { queryOptions } from '@tanstack/react-query'
import { settingPreferenceApi } from './setting-preference.api'
import { settingPreferenceKeys } from './keys'

export const settingPreferenceQueries = {
  me: () =>
    queryOptions({
      queryKey: settingPreferenceKeys.me(),
      queryFn: () => settingPreferenceApi.get(),
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }),
} as const
