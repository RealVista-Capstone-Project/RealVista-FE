/**
 * Listing Entity Types
 * Domain models for the Listing entity
 * Based on the backend API response structure
 */

import { FeeType } from '@/shared/types';

// ============ API Response Wrapper ============
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ============ Property nested in listing detail API ============

/** Expected price bands the owner entered when creating the property (maps to backend `properties.price_range`). */
export interface ListingPropertyPriceRange {
  rent?: {
    min: number | null;
    max: number | null;
  };
  buy?: {
    min: number | null;
    max: number | null;
  };
}

// ============ Property Nested Object ============
export interface PropertyNested {
  description: string;
  property_id: string;
  street_address: string;
  land_size_m2: number;
  usable_size_m2: number;
  width_m: number;
  length_m: number;
  media?: MediaItem[];
  price_range?: ListingPropertyPriceRange | null;
}

// ============ Location ============
export interface Location {
  latitude: number;
  longitude: number;
  location_id: string;
  city_name: string;
  district_name: string;
  ward_name: string;
}

// ============ Property Type ============
export interface PropertyType {
  property_type_id: string;
  property_type_name: string;
  property_type_code: string;
  property_category_id: string;
  property_category_name: string;
  property_category_code: string;
}

// ============ Media ============
export interface MediaItem {
  video: boolean;
  image: boolean;
  '3D': boolean;
  media_id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'THREE_D';
  media_url: string;
  thumbnail_url: string;
  is_primary: boolean;
  display_order: number;
  metadata?: any;
}

// ============ Agent ============
export interface Agent {
  email: string;
  phone: string | null;
  company: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  business_name: string;
  is_verified: boolean;
  avatar_url?: string; // Optional - not always provided by API
}

// ============ Attribute ============
export interface Attribute {
  icon: string;
  text: boolean;
  number: boolean;
  boolean: boolean;
  display_value: string;
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  data_type: 'BOOLEAN' | 'NUMBER' | 'TEXT';
  value_boolean?: boolean;
  value_number?: number;
  value_text?: string;
  unit?: string;
}

// ============ Amenity ============
export interface Amenity {
  amenity_id: string;
  amenity_name: string;
  amenity_type: string;
  is_onsite: boolean;
  is_offsite: boolean;
  description?: string;
}

export type ListingType = 'RENT' | 'SALE';

// ============ Listing Data (main response object) ============
export interface ListingData {
  status: string;
  slug: string;
  name: string;
  content?: string;
  price: number;
  property: PropertyNested;
  location: Location;
  property_type: PropertyType;
  media: MediaItem[];
  agent?: Agent;
  property_owner?: Agent; // present when an agent manages the listing
  attributes: Attribute[];
  amenities: Amenity[];
  listing_id: string;
  property_id: string;
  user_id: string;
  user_type?: 'AGENT' | 'OWNER';
  min_price?: number;
  max_price?: number;
  cost_breakdown?: CostBreakdownAPI;
  is_negotiable: boolean;
  available_from: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  total_photos: number;
  total_videos: number;
  total_3d_tours: number;
  is_favorite?: boolean;
  is_created_by_owner?: boolean;
  security_deposit?: number | null;
  listing_type: ListingType;
  /** One entry per THREE_D media; empty string = unnamed room in metadata. */
  three_d_room_names?: string[];
}

// ============ Cost Breakdown (API format - snake_case) ============
export interface CostBreakdownAPI {
  base_price: number;
  base_price_unit: string;
  required_fees: CostFeeAPI[];
  required_fees_subtotal: number;
  optional_fees: CostFeeAPI[];
  optional_fees_subtotal: number;
  total_cost: number;
  disclaimer: string;
}

export interface CostFeeAPI {
  name: string;
  amount: number;
  fee_type: FeeType;
}

// ============ Price History ============
export type ChangeType = 'INCREASED' | 'DECREASED' | 'UNCHANGED';

export interface PriceHistoryEntry {
  price: number;
  price_history_id: string;
  min_price: number;
  max_price: number;
  changed_at: string;
  price_change: number;
  price_change_percent: number;
  change_type: ChangeType;
}

export interface PriceHistoryData {
  listing_id: string;
  current_price: number;
  price_history: PriceHistoryEntry[];
}

// ============ Similar Listing Types ============
export interface SimilarListing {
  listing_id: string;
  slug: string;
  name: string;
  listing_type: 'RENT' | 'SALE';
  property_type_name: string;
  price: number;
  area: number;
  location_name: string;
  full_address?: string;
  thumbnail_url: string;
  similarity_score: number;
  published_at: string;
  attributes: Attribute[];
  display_price: string;
  display_area: string;
  is_favorite?: boolean;
}

export interface SimilarListingsResponse {
  listings: SimilarListing[];
  total: number;
  limit: number;
}

// ============ Generic Paginated Response ============
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
}

// ============ Managed Listing Summary ============
export interface ManagedListingSummary {
  all: number;
  rent: number;
  sale: number;
}

// ============ Compare Data ============
export interface ListingCompareData {
  listing_id: string;
  slug: string;
  name: string;
  price: number;
  min_price?: number;
  max_price?: number;
  listing_type: ListingType;
  is_negotiable: boolean;
  is_featured: boolean;
  is_hot: boolean;
  thumbnail_url: string | null;
  media_count: number;
  property_type: PropertyType;
  location: Location;
  full_address: string;
  usable_size_m2: number | null;
  land_size_m2: number | null;
  width_m: number | null;
  length_m: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  direction: string | null;
  attributes: Attribute[];
  amenities: Amenity[];
  available_from: string | null;
  published_at: string;
  content: string | null;
}

// ============ Main Listing Type (what we export) ============
export type Listing = ListingData;
export type PriceHistory = PriceHistoryData;
