import type { ListingStatus, ListingType } from './managed-listing';

export interface PropertyInfo {
  property_id: string;
  name: string;
  description?: string;
  total_area?: number;
  land_area?: number;
  year_built?: number;
  floors?: number;
  is_furnished?: boolean;
  parking_spaces?: number;
}

export interface LocationInfo {
  location_id: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}

export interface PropertyTypeInfo {
  property_type_id: string;
  name: string;
  category: string;
}

export interface MediaDTO {
  media_id: string;
  media_type: 'PHOTO' | 'VIDEO' | 'VIRTUAL_TOUR';
  url: string;
  display_order: number;
  is_primary: boolean;
}

export interface AgentInfo {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

export interface PropertyAttribute {
  attribute_id: string;
  name: string;
  value: string;
  category?: string;
}

export interface Amenity {
  amenity_id: string;
  name: string;
  icon?: string;
}

export interface CostBreakdown {
  base_rent?: number;
  security_deposit?: number;
  utilities?: number;
  maintenance?: number;
  other_fees?: number;
}

export interface ListingDetail {
  listing_id: string;
  property_id: string;
  user_id: string;
  listing_type: ListingType;
  status: ListingStatus;
  slug: string;
  name: string;
  price: number;
  min_price?: number;
  max_price?: number;
  is_negotiable: boolean;
  available_from?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  
  property: PropertyInfo;
  location: LocationInfo;
  propertyType: PropertyTypeInfo;
  media?: MediaDTO[];
  agent: AgentInfo;
  attributes?: PropertyAttribute[];
  amenities?: Amenity[];
  
  total_photos: number;
  total_videos: number;
  total_3d_tours: number;
  
  costBreakdown?: CostBreakdown;
  is_favorite: boolean;
}
