import { queryOptions } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import type { PropertySearchRequest, MyPropertiesSearchCriteria } from './property-api.types';

export const propertyQueries = {
  search: (request: PropertySearchRequest) =>
    queryOptions({
      queryKey: ['properties', 'search', request],
      queryFn: () => propertyApi.searchMap(request),
      enabled: !!(request.north_lat && request.south_lat && request.east_lng && request.west_lng),
    }),
  myProperties: (criteria: MyPropertiesSearchCriteria) =>
    queryOptions({
      queryKey: ['properties', 'me', criteria],
      queryFn: () => propertyApi.getMyProperties(criteria),
      placeholderData: (previousData) => previousData,
    }),
};
