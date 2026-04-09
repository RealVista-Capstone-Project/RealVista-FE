import { useQuery } from '@tanstack/react-query';
import { propertyApi } from './property.api';

export const useProperty3dOperations = (propertyId: string) => {
  return useQuery({
    queryKey: ['property-3d-operations', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const res = await propertyApi.get3dOperations(propertyId);
      // The backend returns List directly, so payload is an array
      return Array.isArray(res.payload)
        ? res.payload
        : (res.payload as { data?: unknown[] })?.data || [];
    },
    refetchInterval: 10000, // Poll every 10s just in case
    enabled: !!propertyId,
  });
};
