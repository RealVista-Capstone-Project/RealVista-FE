import http from '@/shared/lib/http';
import type {
  PropertySearchRequest,
  PropertySearchResponse,
  MyPropertiesSearchCriteria,
  MyPropertiesResponse,
} from './property-api.types';

export const propertyApi = {
  search: (request: PropertySearchRequest) => {
    return http.post<PropertySearchResponse>('map/listings', request, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT
        ? `${process.env.NEXT_PUBLIC_API_ENDPOINT}`
        : undefined,
    });
  },
  getMyProperties: (criteria: MyPropertiesSearchCriteria) => {
    const queryParams = new URLSearchParams();
    if (criteria.keyword) queryParams.append('keyword', criteria.keyword);
    queryParams.append('page', criteria.page.toString());
    queryParams.append('size', criteria.size.toString());

    return http.get<MyPropertiesResponse>(`properties/me?${queryParams.toString()}`, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT
        ? `${process.env.NEXT_PUBLIC_API_ENDPOINT}`
        : undefined,
    });
  },
  updateProperty: (propertyId: string, data: any) => {
    return http.put<any>(`properties/${propertyId}`, data, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT
        ? `${process.env.NEXT_PUBLIC_API_ENDPOINT}`
        : undefined,
    });
  },
};
