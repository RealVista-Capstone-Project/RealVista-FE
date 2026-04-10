import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from './property.api';

export function useDelete3dRoom(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operationId: string) =>
      propertyApi.delete3dOperation(propertyId, operationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-3d-operations', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-detail', propertyId] });
    },
  });
}
