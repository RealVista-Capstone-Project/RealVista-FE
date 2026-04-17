import http from '@/shared/lib/http';
import { env } from '@/shared/lib/env';
import type {
  ApiResponse,
  CreatePropertyRequest,
  MyPropertiesResponse,
  Property3dOperation,
  CreateProperty3dOperationRequest,
  MyPropertiesSearchCriteria,
  OwnerAvailablePropertiesCriteria,
  OwnerAvailablePropertiesResponse,
  PropertyAttributeDefinition,
  PropertyDetailResponse,
  PropertySearchResponse,
  PropertyTypesResponse,
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

  searchMap: (request: import('./property-api.types').PropertySearchRequest) => {
    return http.post<PropertySearchResponse>('map/listings', request, {
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

  getAttributes: (propertyTypeId?: string) => {
    const url = propertyTypeId
      ? `properties/attributes?property_type_id=${propertyTypeId}`
      : 'properties/attributes';
    return http.get<ApiResponse<PropertyAttributeDefinition[]>>(url, {
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
  updateRoomName: (propertyId: string, operationId: string, roomName: string) => {
    return http.patch<ApiResponse<Property3dOperation>>(
      `properties/${propertyId}/3d-operations/${operationId}`,
      { room_name: roomName },
      { baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT }
    );
  },
  delete3dOperation: (propertyId: string, operationId: string) => {
    return http.delete<ApiResponse<void>>(
      `properties/${propertyId}/3d-operations/${operationId}`,
      { baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT }
    );
  },
  deleteMedia: (mediaId: string) => {
    return http.delete<ApiResponse<void>>(`media/${mediaId}`, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  updatePropertyStatus: ({
    propertyId,
    status,
  }: {
    propertyId: string;
    status: string;
  }) => {
    return http.patch<ApiResponse<PropertyDetailResponse>>(
      `properties/${propertyId}/status?status=${encodeURIComponent(status)}`,
      {},
      { baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT }
    );
  },

  deleteProperty: (propertyId: string) => {
    return http.delete<ApiResponse<void>>(`properties/${propertyId}`, {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },

  getOwnerAvailableProperties: (criteria: OwnerAvailablePropertiesCriteria) => {
    const queryParams = new URLSearchParams();
    if (criteria.keyword) queryParams.append('keyword', criteria.keyword);
    if (criteria.property_type_id) queryParams.append('propertyTypeId', criteria.property_type_id);
    if (criteria.location_id) queryParams.append('locationId', criteria.location_id);
    if (criteria.listing_type) queryParams.append('listingType', criteria.listing_type);

    // Price filters - flat params per API spec
    if (criteria.min_rent_price !== undefined) {
      queryParams.append('minRentPrice', criteria.min_rent_price.toString());
    }
    if (criteria.max_rent_price !== undefined) {
      queryParams.append('maxRentPrice', criteria.max_rent_price.toString());
    }
    if (criteria.min_buy_price !== undefined) {
      queryParams.append('minBuyPrice', criteria.min_buy_price.toString());
    }
    if (criteria.max_buy_price !== undefined) {
      queryParams.append('maxBuyPrice', criteria.max_buy_price.toString());
    }

    queryParams.append('page', criteria.page.toString());
    queryParams.append('size', criteria.size.toString());

    return http.get<OwnerAvailablePropertiesResponse>(
      `properties/feed?${queryParams.toString()}`,
      {
        baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
      }
    );
  },

  getPropertyTypes: () => {
    return http.get<PropertyTypesResponse>('properties/types', {
      baseUrl: process.env.NEXT_PUBLIC_API_ENDPOINT,
    });
  },
};
