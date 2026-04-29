export interface PropertySummaryResponse {
  property_id: string;
  owner_id: string;
  property_type_id: string;
  street_address: string;
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED'
    | 'AVAILABLE'
    | 'RESERVED'
    | 'SOLD'
    | 'RENTED';
  land_size_m2: number | null;
  usable_size_m2: number | null;
  width_m: number | null;
  length_m: number | null;
  area_sqft: number | null;
  description: string | null;
  property_type_info: PropertyTypeInfo | null;
  location_info: LocationInfo | null;
  attributes: PropertyAttributeItem[] | null;
  media: PropertyMediaItem[] | null;
  thumbnail_url: string | null;
  amenities: PropertyAmenityItem[] | null;
  owner_name: string | null;
  owner_phone: string | null;
  has_3d: boolean;
  price_range: PropertyPriceRange | null;
  sold_by_user_id: string | null;
  sold_by_name: string | null;
  sold_by_phone: string | null;
  sold_by_role: 'OWNER' | 'AGENT' | null;
  sold_at: string | null;
}
export interface PropertySearchRequest {
  north_lat: number;
  south_lat: number;
  east_lng: number;
  west_lng: number;
  listing_type?: 'RENT' | 'SALE';
  min_price?: number;
  max_price?: number;
  limit?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  search_text?: string;
  /** @deprecated Use property_category or property_type */
  category?: string;
  property_category?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  rental_period?: string;
  page?: number;
  size?: number;
}

import { type ListingSearchResponse } from '@/shared/types/search';

export type PropertyListingDto = ListingSearchResponse;

export interface PropertySearchResponse {
  success: boolean;
  message: string;
  data: {
    content: PropertyListingDto[];
    page: number;
    size: number;
    total_elements: number;
    total_pages: number;
    first: boolean;
    last: boolean;
    bounds: {
      north_lat: number;
      south_lat: number;
      east_lng: number;
      west_lng: number;
    };
    has_more: boolean;
    filter_metadata: {
      applied_filters: {
        /** @deprecated */
        category?: string;
        property_category?: string;
        property_type?: string;
        price_range?: {
          min: number;
          max: number;
        };
        bedrooms?: number;
        bathrooms?: number;
        area?: number;
        rental_period?: string;
        listing_type?: string;
        search_text?: string;
      };
    };
  };
  timestamp: string;
}

export interface MyPropertiesSearchCriteria {
  keyword?: string;
  status?: string;
  page: number;
  size: number;
}

export interface PropertyTypeInfo {
  property_type_id: string;
  property_type_name: string | null;
  property_type_code: string | null;
  property_category_id: string | null;
  property_category_name: string | null;
  property_category_code: string | null;
}

export interface LocationInfo {
  location_id: string;
  city_name: string | null;
  district_name: string | null;
  ward_name: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PropertyAttributeRangeResponse {
  range_id: string;
  label: string;
  min_value: number | null;
  max_value: number | null;
  display_order: number;
}

export interface PropertyAttributeDefinition {
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  data_type: string;
  icon: string | null;
  unit: string | null;
  ranges: PropertyAttributeRangeResponse[] | null;
}

export interface PropertySummaryResponse {
  property_id: string;
  owner_id: string;
  property_type_id: string;
  street_address: string;
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED'
    | 'AVAILABLE'
    | 'RESERVED'
    | 'SOLD'
    | 'RENTED';
  land_size_m2: number | null;
  usable_size_m2: number | null;
  width_m: number | null;
  length_m: number | null;
  area_sqft: number | null;
  description: string | null;
  property_type_info: PropertyTypeInfo | null;
  location_info: LocationInfo | null;
  attributes: PropertyAttributeItem[] | null;
  media: PropertyMediaItem[] | null;
  thumbnail_url: string | null;
  amenities: PropertyAmenityItem[] | null;
  owner_name: string | null;
  owner_phone: string | null;
  has_3d: boolean;
  price_range: PropertyPriceRange | null;
  sold_by_user_id: string | null;
  sold_by_name: string | null;
  sold_by_phone: string | null;
  sold_by_role: 'OWNER' | 'AGENT' | null;
  sold_at: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  // snake_case (internal/legacy APIs)
  total_elements?: number;
  total_pages?: number;
  // camelCase (new feed API)
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
  first?: boolean;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface MyPropertiesResponse {
  success: boolean;
  message: string;
  data: PageResponse<PropertySummaryResponse>;
  timestamp: string;
}

export interface PropertyAttributeRequest {
  attribute_id?: string;
  attribute_code?: string;
  value_number?: number;
  value_text?: string;
  value_boolean?: boolean;
}

export interface PropertyMediaRequest {
  url: string;
  thumbnailUrl?: string;
  type: 'IMAGE' | 'VIDEO' | 'VIRTUAL_TOUR' | 'DOCUMENT' | 'THREE_D';
  isThumbnail?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreatePropertyRequest {
  owner_id?: string;
  location_id: string;
  property_type_id: string;
  street_address: string;
  latitude: number;
  longitude: number;
  land_size_m2?: number;
  usable_size_m2?: number;
  width_m?: number;
  length_m?: number;
  descriptions?: string;
  extra_attributes?: Record<string, unknown>;
  amenity_ids?: string[];
  attributes?: PropertyAttributeRequest[];
  media?: PropertyMediaRequest[];
  status?: string;
  price_range?: {
    rent?: { min?: number; max?: number };
    buy?: { min?: number; max?: number };
  };
}

export type UpdatePropertyRequest = Partial<CreatePropertyRequest>;

export interface ListingSummaryDTO {
  listing_id: string;
  name: string;
  slug: string;
  price: number;
  listing_type: 'RENT' | 'SALE';
  thumbnail_url: string | null;
  agent_name: string | null;
}

export interface PropertyDetailResponse {
  property_id: string;
  owner_id: string;
  location_id: string;
  district_id?: string;
  city_id?: string;
  property_type_id: string;
  property_type_code?: string;
  street_address: string;
  latitude: number;
  longitude: number;
  status: string;
  slug: string;
  land_size_m2?: number;
  usable_size_m2?: number;
  width_m?: number;
  length_m?: number;
  descriptions?: string;
  extra_attributes?: Record<string, unknown>;
  amenities?: Array<{
    amenity_id: string;
    amenity_name: string;
  }>;
  attributes?: Array<{
    attribute_id: string;
    attribute_code: string;
    attribute_name: string;
    data_type: string;
    icon: string | null;
    unit: string | null;
    value_number: number | null;
    value_text: string | null;
    value_boolean: boolean | null;
  }>;
  media?: Array<{
    media_id: string;
    media_url: string;
    thumbnail_url: string | null;
    media_type: 'IMAGE' | 'VIDEO' | 'VIRTUAL_TOUR' | 'DOCUMENT' | 'THREE_D';
    is_primary: boolean;
    metadata?: Record<string, unknown>;
  }>;
  active_listings?: ListingSummaryDTO[];
  price_range?: PropertyPriceRange | null;
}

export interface PropertySummary {
  property_id: string;
  property_type_id: string;
  street_address: string;
  status: string;
  land_size_m2?: number;
  thumbnail_url?: string;
  owner_name?: string;
  owner_phone?: string;
}

export interface Property3dOperation {
  operation_id: string;
  property_id?: string;
  status?: string;
  room_name?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface CreateProperty3dOperationRequest {
  model: string;
  display_name?: string;
  room_name?: string;
  images: Array<{
    media_asset_id: string;
    azimuth: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface MyPropertiesSearchCriteria {
  keyword?: string;
  status?: string;
  page: number;
  size: number;
}

export interface OwnerAvailablePropertiesCriteria {
  keyword?: string;
  property_type_id?: string;
  location_id?: string;
  min_rent_price?: number;
  max_rent_price?: number;
  min_buy_price?: number;
  max_buy_price?: number;
  listing_type?: 'SELL' | 'RENT';
  page: number;
  size: number;
}

export interface PropertyTypeInfo {
  property_type_id: string;
  property_type_name: string | null;
  property_type_code: string | null;
  property_category_id: string | null;
  property_category_name: string | null;
  property_category_code: string | null;
}

export interface LocationInfo {
  location_id: string;
  city_name: string | null;
  district_name: string | null;
  ward_name: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type PropertyAttributeRangeDTO = Record<string, any>;

export interface PropertyAttributeItem {
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  data_type: string;
  icon: string | null;
  unit: string | null;
  priority?: number | null;
  value_number: number | null;
  value_text: string | null;
  value_boolean: boolean | null;
  ranges?: PropertyAttributeRangeDTO[] | null;
  display_value?: string | null;
}

export interface PropertyMediaItem {
  media_id: string | null;
  media_type: 'VIDEO' | 'IMAGE' | 'THREE_D' | null;
  media_url: string | null;
  thumbnail_url: string | null;
  is_primary: boolean | null;
  is_property_standard: boolean | null;
  display_order: number | null;
  metadata?: Record<string, any> | null;
}

export interface PropertyAmenityItem {
  amenity_id: string;
  amenity_name: string;
  amenity_type?: 'ONSITE' | 'OFFSITE' | string | null;
  description?: string | null;
  is_onsite?: boolean;
  is_offsite?: boolean;
}

export interface PropertyPriceRange {
  rent?: {
    min: number | null;
    max: number | null;
  };
  buy?: {
    min: number | null;
    max: number | null;
  };
}

export interface PropertyAttributeRangeResponse {
  range_id: string;
  label: string;
  min_value: number | null;
  max_value: number | null;
  display_order: number;
}

export interface PropertyAttributeDefinition {
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  data_type: string;
  icon: string | null;
  unit: string | null;
  ranges: PropertyAttributeRangeResponse[] | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  // snake_case (internal/legacy APIs)
  total_elements?: number;
  total_pages?: number;
  // camelCase (new feed API)
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
  first?: boolean;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface MyPropertiesResponse {
  success: boolean;
  message: string;
  data: PageResponse<PropertySummaryResponse>;
  timestamp: string;
}

export interface OwnerPropertySummary {
  property_id: string;
  owner_id: string;
  owner_name: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  street_address: string;
  latitude?: number | null;
  longitude?: number | null;
  land_size_m2: number | null;
  usable_size_m2: number | null;
  width_m?: number | null;
  length_m?: number | null;
  status: string;
  descriptions: string | null;
  price_range?: PropertyPriceRange | null;
  property_type_info: PropertyTypeInfo | null;
  location_info: LocationInfo | null;
  media: PropertyMediaItem[] | null;
  attributes: PropertyAttributeItem[] | null;
  amenities?: PropertyAmenityItem[] | null;
  has_active_proposal?: boolean;
}

export interface OwnerAvailablePropertiesResponse {
  success: boolean;
  message: string;
  data: PageResponse<OwnerPropertySummary>;
  timestamp: string;
}

export interface PropertyTypeInfoDTO {
  property_type_id: string;
  property_type_name: string;
  property_type_code: string;
  property_category_id: string;
  property_category_name: string;
  property_category_code: string;
}

export interface PropertyTypesResponse {
  success: boolean;
  message: string;
  data: PropertyTypeInfoDTO[];
}
