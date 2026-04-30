import { useMutation, useQueryClient } from '@tanstack/react-query';

import { locationApi } from './location.api';
import { locationKeys } from './keys';
import type { LocationStatus } from './location-api.types';

export const useChangeLocationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LocationStatus }) => {
      if (status === 'ACTIVE') return locationApi.activateLocation(id);
      return locationApi.archiveLocation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.admin() });
      queryClient.invalidateQueries({ queryKey: locationKeys.cities() });
      queryClient.invalidateQueries({ queryKey: locationKeys.districts() });
    },
  });
};
