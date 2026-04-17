import { useQuery } from '@tanstack/react-query';
import { propertyApi } from './property.api';

export function usePropertyAttributes(propertyTypeId?: string) {
  return useQuery({
    queryKey: ['property-attributes', propertyTypeId ?? 'all'],
    queryFn: async () => {
      const response = await propertyApi.getAttributes(propertyTypeId);
      return response.payload.success ? response.payload.data : [];
    },
    enabled: !!propertyTypeId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
