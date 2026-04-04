import http from '@/shared/lib/http';
import { env } from '@/shared/lib/env';
import type {
  ApiResponse,
  CreatePropertyRequest,
  MyPropertiesResponse,
  Property3dOperation,
  CreateProperty3dOperationRequest,
  MyPropertiesSearchCriteria,
  PropertyAttributeDefinition,
  PropertyDetailResponse,
  PropertySearchResponse,
  UpdatePropertyRequest,
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

    return http.get<PropertySearchResponse>(url, {
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

  getMyProperties: (criteria?: MyPropertiesSearchCriteria) => {
    const queryParams = new URLSearchParams();
    const page = criteria?.page ?? 0;
    const size = criteria?.size ?? 10;
    if (criteria?.keyword) queryParams.append('keyword', criteria.keyword);
    if (criteria?.status) queryParams.append('status', criteria.status);
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());

    return http.get<MyPropertiesResponse>(`properties/me?${queryParams.toString()}`, {
      baseUrl: env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  getPropertyDetails: (propertyId: string) => {
    return http.get<ApiResponse<PropertyDetailResponse>>(`properties/${propertyId}`, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  getAttributes: () => {
    return http.get<ApiResponse<PropertyAttributeDefinition[]>>('properties/attributes', {
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

  get3dOperations: (propertyId: string) => {
    return http.get<Property3dOperation[] | ApiResponse<Property3dOperation[]>>(
      `properties/${propertyId}/3d-operations`,
      {
        baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
      }
    );
  },
  initiate3dOperation: (propertyId: string, request: CreateProperty3dOperationRequest) => {
    return http.post<Property3dOperation | ApiResponse<Property3dOperation>>(
      `properties/${propertyId}/3d-operations`,
      request,
      { baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT }
    );
  },
};
