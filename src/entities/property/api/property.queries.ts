import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import type {
  PropertySearchRequest,
  MyPropertiesSearchCriteria,
  OwnerAvailablePropertiesCriteria,
} from './property-api.types';

export const propertyQueries = {
  search: (request: PropertySearchRequest) =>
    queryOptions({
      queryKey: ['properties', 'search', request],
      queryFn: () => propertyApi.searchMap(request),
      enabled: !!(request.north_lat && request.south_lat),
    }),
  myProperties: (criteria: MyPropertiesSearchCriteria) =>
    queryOptions({
      queryKey: ['properties', 'me', criteria],
      queryFn: () => propertyApi.getMyProperties(criteria),
      placeholderData: (previousData) => previousData,
    }),
  ownerAvailable: (criteria: OwnerAvailablePropertiesCriteria) =>
    queryOptions({
      queryKey: ['properties', 'owner-available', criteria],
      queryFn: () => propertyApi.getOwnerAvailableProperties(criteria),
      staleTime: 2 * 60 * 1000,
      placeholderData: (previousData) => previousData,
    }),
  ownerAvailableInfinite: (criteria: Omit<OwnerAvailablePropertiesCriteria, 'page'>) =>
    infiniteQueryOptions({
      queryKey: ['properties', 'owner-available-infinite', criteria],
      queryFn: ({ pageParam }) =>
        propertyApi.getOwnerAvailableProperties({ ...criteria, page: pageParam as number }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const data = lastPage?.payload?.data;
        if (!data) return undefined;
        const isLast = data.last ?? (data.has_next === false);
        const currentPage = data.page ?? 0;
        return isLast ? undefined : currentPage + 1;
      },
      staleTime: 2 * 60 * 1000,
    }),
  propertyTypes: () =>
    queryOptions({
      queryKey: ['properties', 'types'],
      queryFn: () => propertyApi.getPropertyTypes(),
      staleTime: 10 * 60 * 1000,
    }),
};
