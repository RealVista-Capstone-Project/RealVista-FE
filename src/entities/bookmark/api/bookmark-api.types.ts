export interface PropertyAttributeDTO {
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  data_type: string | null;
  icon: string | null;
  unit: string | null;
  value_number: number | null;
  value_text: string | null;
  value_boolean: boolean | null;
}

export type BookmarkListingType = 'SALE' | 'RENT';

export interface BookmarkListingCardDTO {
  listing_id: string;
  slug: string;
  title: string;
  price: number;
  listing_type: BookmarkListingType;
  is_negotiable: boolean;
  primary_image_url: string | null;
  street_address: string | null;
  city_name: string | null;
  district_name: string | null;
  ward_name: string | null;
  full_address: string;
  property_type_name: string | null;
  property_category_name: string | null;
  attributes: PropertyAttributeDTO[];
  bookmarked_at: string;
  area_sqft: number | null;
  usable_size_m2: number | null;
  status?: string;
  is_boosted?: boolean;
  boost_packages?: string[];
  user_type?: string;
}

export interface BookmarkPageResponse {
  content: BookmarkListingCardDTO[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
}

export interface GetBookmarksParams {
  propertyTypes?: string[];
  listingType?: 'SALE' | 'RENT';
  sortDirection?: 'NEWEST' | 'OLDEST';
  page?: number;
  size?: number;
}
