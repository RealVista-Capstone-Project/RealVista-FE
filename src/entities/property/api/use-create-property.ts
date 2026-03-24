import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import type { CreatePropertyRequest } from './property-api.types';

export const useCreateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreatePropertyRequest) => propertyApi.createProperty(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};
