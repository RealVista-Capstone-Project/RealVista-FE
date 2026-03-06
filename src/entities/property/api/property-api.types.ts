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
