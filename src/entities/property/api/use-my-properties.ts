import { useQuery } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import { PropertySummary } from './property-api.types';

export const MY_PROPERTIES_QUERY_KEY = ['properties', 'me'];

export function useMyProperties() {
  console.log('[useMyProperties] Hook called');
  return useQuery<PropertySummary[], Error>({
    queryKey: MY_PROPERTIES_QUERY_KEY,
    queryFn: async () => {
      console.log('[useMyProperties] queryFn started - calling API...');
      try {
        const response = await propertyApi.getMyProperties({
          page: 0,
          size: 100,
        });
        console.log('[useMyProperties] API response received:', response);

        // Since response.payload.data is now PropertySummary[]
        return response.payload.data;
      } catch (error) {
        console.error('[useMyProperties] API call failed:', error);
        throw error;
      }
    },
    staleTime: 0,
    refetchOnMount: true,
  });
}
