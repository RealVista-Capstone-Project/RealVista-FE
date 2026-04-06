import { useQuery } from '@tanstack/react-query';
import { propertyApi } from './property.api';

export function usePropertyAttributes() {
  return useQuery({
    queryKey: ['property-attributes'],
    queryFn: async () => {
      const response = await propertyApi.getAttributes();
      return response.payload.success ? response.payload.data : [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
