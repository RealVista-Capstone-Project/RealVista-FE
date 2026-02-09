export interface PropertySearchRequest {
  north_lat: number;
  south_lat: number;
  east_lng: number;
  west_lng: number;
  listing_type?: 'RENT' | 'BUY';
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
  street_address: string;
  price: number;
  listing_type: 'RENT' | 'BUY';
  name: string;
  thumbnail_url: string;
  size_m2: number;
  property_type: string;
  location_name: string;
  is_favorite: boolean;
  // Optional fields as per user example (missing in sample but likely needed)
  bedrooms?: number;
  bathrooms?: number;
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
