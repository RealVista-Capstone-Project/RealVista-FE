import { queryOptions } from '@tanstack/react-query';
import { locationApi } from './location.api';
import { locationKeys } from './keys';
import type { AdminLocationListParams } from './location-api.types';

export const locationQueries = {
  adminList: (params?: AdminLocationListParams) =>
    queryOptions({
      queryKey: locationKeys.adminList(params),
      queryFn: async () => {
        const response = await locationApi.adminList(params);
        return response?.payload?.data;
      },
    }),
} as const;
