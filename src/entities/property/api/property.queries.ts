import { queryOptions } from '@tanstack/react-query';
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
      queryFn: () => propertyApi.search(request),
      enabled: !!(request.north_lat && request.south_lat && request.east_lng && request.west_lng),
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
};
