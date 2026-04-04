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
  category?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  rental_period?: string;
  page?: number;
  size?: number;
}

export interface PropertyListingDto {
  listing_id: string;
  slug: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  street_address: string | null;
  ward_name: string | null;
  district_name: string | null;
  city_name: string | null;
  full_address: string;
  price: number;
  listing_type: 'RENT' | 'SALE';
  name: string;
  thumbnail_url: string;
  size_m2: number;
  property_type: string;
  is_favorite: boolean;
  bedrooms?: number;
  bathrooms?: number;
  attributes?: Array<{
    attribute_id: string;
    attribute_code: string;
    attribute_name: string;
    icon: string | null;
    unit: string | null;
    value_number: number | null;
    value_text: string | null;
    value_boolean: boolean | null;
  }>;
}

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
        category?: string;
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
  type: 'IMAGE' | 'VIDEO' | 'VIRTUAL_TOUR' | 'DOCUMENT';
  isThumbnail?: boolean;
  metadata?: any;
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
}

export type UpdatePropertyRequest = Partial<CreatePropertyRequest>;

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
    dataType: string;
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
    metadata?: any;
  }>;
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
  error_message?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface CreateProperty3dOperationRequest {
  model: string;
  display_name?: string;
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
