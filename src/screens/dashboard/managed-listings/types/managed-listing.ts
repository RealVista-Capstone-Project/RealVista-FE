export enum ListingStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  ARCHIVED = 'ARCHIVED',
}

export enum ListingType {
  RENT = 'RENT',
  SALE = 'SALE',
}

export interface ManagedListing {
  listing_id: string;
  property_id: string;
  user_id: string;
  listing_type: ListingType;
  status: ListingStatus;
  name: string;
  slug: string;
  price: number;
  min_price?: number;
  max_price?: number;
  is_negotiable: boolean;
  available_from?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Additional fields from property for display
  property?: {
    property_id: string;
    total_area?: number;
    location?: {
      address: string;
      city?: string;
      state?: string;
    };
  };
  // Preview image
  thumbnail?: string;
}
