import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationApi } from './location.api';
import { locationKeys } from './keys';
import type { CreateLocationRequest } from './location-api.types';

export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: CreateLocationRequest) => locationApi.createLocation(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.admin() });
      queryClient.invalidateQueries({ queryKey: locationKeys.cities() });
      queryClient.invalidateQueries({ queryKey: locationKeys.districts() });
    },
  });
};
