import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from './property.api';

interface UpdateRoomNameVariables {
  operationId: string;
  roomName: string;
}

export function useUpdateRoomName(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ operationId, roomName }: UpdateRoomNameVariables) =>
      propertyApi.updateRoomName(propertyId, operationId, roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-3d-operations', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-detail', propertyId] });
    },
  });
}
