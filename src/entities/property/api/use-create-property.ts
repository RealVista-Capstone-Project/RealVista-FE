import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import type { CreatePropertyRequest } from './property-api.types';
import { MY_PROPERTIES_QUERY_KEY } from './use-my-properties';

export const useCreateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreatePropertyRequest) => propertyApi.createProperty(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_PROPERTIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};
