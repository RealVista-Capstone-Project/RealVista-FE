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
  myPropertiesInfinite: (criteria: Omit<MyPropertiesSearchCriteria, 'page'>) =>
    infiniteQueryOptions({
      queryKey: ['properties', 'me', 'infinite', criteria],
      queryFn: ({ pageParam }) =>
        propertyApi.getMyProperties({ ...criteria, page: pageParam as number }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const data = lastPage?.payload?.data;
        if (!data) return undefined;
        const currentPage = data.page ?? 0;
        const totalPages = data.total_pages ?? data.totalPages;
        if (typeof totalPages === 'number' && totalPages > 0 && currentPage + 1 >= totalPages) {
          return undefined;
        }
        if (data.last === true) return undefined;
        if (data.has_next === false) return undefined;
        const pageSize = data.size ?? criteria.size;
        const content = data.content ?? [];
        if (pageSize > 0 && content.length < pageSize) return undefined;
        return currentPage + 1;
      },
      staleTime: 2 * 60 * 1000,
    }),
  mySummary: () =>
    queryOptions({
      queryKey: ['properties', 'me', 'summary'],
      queryFn: async () => {
        const res = await propertyApi.getMyPropertiesSummary();
        return res.payload.data;
      },
      staleTime: 60 * 1000,
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
  adminList: (criteria?: {
    keyword?: string;
    status?: string;
    userId?: string;
    propertyTypeId?: string;
    locationId?: string;
    page?: number;
    size?: number;
  }) =>
    queryOptions({
      queryKey: ['properties', 'admin', criteria],
      queryFn: () => propertyApi.adminListProperties(criteria),
      placeholderData: (previousData) => previousData,
    }),
};
