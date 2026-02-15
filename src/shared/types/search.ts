// API Types for Advanced Search
export interface AdvancedSearchRequest {
  query?: string;
  listingType?: 'SALE' | 'RENT';
  propertyType?: string;
  propertyCategory?: string;
  location?: string;
  price?: [number | null, number | null];
  area?: [number | null, number | null];
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
  balconyDirection?: string;
  legal?: string;
  furniture?: string;
  availableFrom?: string;
  dynamic?: Record<string, any>;
  hasVideo?: boolean;
  has3D?: boolean;
  sortBy?: 'PRIORITY' | 'DATE_DESC' | 'PRICE_ASC' | 'PRICE_DESC';
}

export interface ListingSearchResponse {
  listing_id: string;
  name: string;
  slug: string;
  listing_type: 'SALE' | 'RENT';
  status: string;
  price: number;
  area: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  thumbnail?: string;
  published_at: string;
  is_boosted: boolean;
  boost_package?: string;
  user_type: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    page_number: number;
    page_size: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  total_pages: number;
  total_elements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  number_of_elements: number;
  first: boolean;
  empty: boolean;
}
