import { useQuery } from '@tanstack/react-query';
import { locationApi } from './location.api';

export const useCities = () => {
  return useQuery({
    queryKey: ['locations', 'cities'],
    queryFn: async () => {
      const response = await locationApi.getCities();
      return response?.payload?.data || [];
    },
  });
};

export const useChildrenLocations = (parentId?: string) => {
  return useQuery({
    queryKey: ['locations', 'children', parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const response = await locationApi.getChildrenLocations(parentId);
      return response?.payload?.data || [];
    },
    enabled: !!parentId,
  });
};
