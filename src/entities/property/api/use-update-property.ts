import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import type { UpdatePropertyRequest } from './property-api.types';
import { PROPERTY_DETAIL_QUERY_KEY } from './use-property-detail';
import { MY_PROPERTIES_QUERY_KEY } from './use-my-properties';

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { propertyId: string; request: UpdatePropertyRequest }) =>
      propertyApi.updateProperty(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MY_PROPERTIES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PROPERTY_DETAIL_QUERY_KEY, variables.propertyId],
      });
    },
  });
};
