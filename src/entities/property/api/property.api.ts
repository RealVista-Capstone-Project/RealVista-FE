import http from '@/shared/lib/http';
import type {
  CreatePropertyRequest,
  UpdatePropertyRequest,
  PropertyDetailResponse,
  ApiResponse,
  PropertySummary,
} from './property-api.types';

export const propertyApi = {
  search: (params: {
    address?: string;
    north_lat?: number;
    south_lat?: number;
    east_lng?: number;
    west_lng?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `properties/search?${queryString}` : 'properties/search';

    return http.get<ApiResponse<PropertySummary[]>>(url, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
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

  verifyByAgent: (propertyId: string) => {
    return http.post<ApiResponse<void>>(
      `properties/${propertyId}/verify-agent`,
      {},
      {
        baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
      }
    );
  },
  assignAgent: (propertyId: string) => {
    return http.post<ApiResponse<PropertyDetailResponse>>(
      `properties/${propertyId}/assign-agent`,
      {},
      {
        baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
      }
    );
  },
};
