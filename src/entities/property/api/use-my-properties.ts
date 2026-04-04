import { useQuery } from '@tanstack/react-query';
import { propertyApi } from './property.api';

export const MY_PROPERTIES_QUERY_KEY = 'my-properties';

export function useMyProperties() {
  return useQuery({
    queryKey: [MY_PROPERTIES_QUERY_KEY],
    queryFn: async () => {
      const response = await propertyApi.getMyProperties({
        page: 0,
        size: 10,
      });
      return response.payload.data.content;
    },
  });
}
