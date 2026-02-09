import { queryOptions } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import type { PropertySearchRequest } from './property-api.types';

export const propertyQueries = {
  search: (request: PropertySearchRequest) =>
    queryOptions({
      queryKey: ['properties', 'search', request],
      queryFn: () => propertyApi.search(request),
    }),
};
