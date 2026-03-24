import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import type { UpdatePropertyRequest } from './property-api.types';

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { propertyId: string; request: UpdatePropertyRequest }) =>
      propertyApi.updateProperty(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId] });
    },
  });
};
