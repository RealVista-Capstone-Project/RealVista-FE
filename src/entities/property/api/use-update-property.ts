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
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [MY_PROPERTIES_QUERY_KEY] }),
        queryClient.refetchQueries({ queryKey: ['properties', 'me'] }),
        queryClient.refetchQueries({ queryKey: [PROPERTY_DETAIL_QUERY_KEY, variables.propertyId] }),
      ]);
    },
  });
};
