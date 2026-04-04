import { useQuery } from '@tanstack/react-query';
import { propertyApi } from './property.api';

export const PROPERTY_DETAIL_QUERY_KEY = 'property-detail';

export const usePropertyDetail = (propertyId?: string) => {
  return useQuery({
    queryKey: [PROPERTY_DETAIL_QUERY_KEY, propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const response = await propertyApi.getPropertyDetails(propertyId);
      return response.payload.data;
    },
    enabled: !!propertyId,
  });
};
