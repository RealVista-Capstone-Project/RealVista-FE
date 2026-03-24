import { useQuery } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import { PropertySummary } from './property-api.types';

export const MY_PROPERTIES_QUERY_KEY = 'my-properties';

export function useMyProperties() {
  return useQuery<PropertySummary[], Error>({
    queryKey: [MY_PROPERTIES_QUERY_KEY],
    queryFn: async () => {
      const response = await propertyApi.getMyProperties();
      return response.payload.data;
    },
  });
}
