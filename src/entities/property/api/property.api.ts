import http from '@/shared/lib/http';
import type {
  PropertySearchRequest,
  PropertySearchResponse,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  PropertyDetailResponse,
  ApiResponse,
  PropertySummary,
} from './property-api.types';

export const propertyApi = {
  search: (request: PropertySearchRequest) => {
    return http.post<PropertySearchResponse>('map/listings', request, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT
        ? `${process.env.NEXT_PUBLIC_API_ENDPOINT}`
        : undefined,
    });
  },

  createProperty: (request: CreatePropertyRequest) => {
    return http.post<ApiResponse<PropertyDetailResponse>>('properties', request, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  updateProperty: ({
    propertyId,
    request,
  }: {
    propertyId: string;
    request: UpdatePropertyRequest;
  }) => {
    return http.put<ApiResponse<PropertyDetailResponse>>(`properties/${propertyId}`, request, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  getMyProperties: () => {
    return http.get<ApiResponse<PropertySummary[]>>(`properties/me`, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  getPropertyDetails: (propertyId: string) => {
    return http.get<ApiResponse<PropertyDetailResponse>>(`properties/${propertyId}`, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },
};
