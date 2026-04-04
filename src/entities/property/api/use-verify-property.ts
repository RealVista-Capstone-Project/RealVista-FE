import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import { MY_PROPERTIES_QUERY_KEY } from './use-my-properties';

export function useVerifyPropertyByAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => propertyApi.verifyByAgent(propertyId),
    onSuccess: (_, propertyId) => {
      // Invalidate specific property and the list
      queryClient.invalidateQueries({ queryKey: [MY_PROPERTIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    },
  });
}
