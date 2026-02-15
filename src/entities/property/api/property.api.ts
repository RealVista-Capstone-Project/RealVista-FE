import http from '@/shared/lib/http';
import type { PropertySearchRequest, PropertySearchResponse } from './property-api.types';

export const propertyApi = {
  search: (request: PropertySearchRequest) => {
    return http.post<PropertySearchResponse>('map/listings', request, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT
        ? `${process.env.NEXT_PUBLIC_API_ENDPOINT}`
        : undefined,
    });
  },
};
