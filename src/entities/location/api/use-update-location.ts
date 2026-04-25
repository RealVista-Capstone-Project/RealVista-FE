import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationApi } from './location.api';
import { locationKeys } from './keys';
import type { UpdateLocationRequest } from './location-api.types';

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateLocationRequest }) =>
      locationApi.updateLocation(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.admin() });
      queryClient.invalidateQueries({ queryKey: locationKeys.cities() });
      queryClient.invalidateQueries({ queryKey: locationKeys.districts() });
    },
  });
};
