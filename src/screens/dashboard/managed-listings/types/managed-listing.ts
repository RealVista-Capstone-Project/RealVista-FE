export enum ListingStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Shared status config - single source of truth for status display across
 * listing-card, listing-detail-panel, and listing-status-actions.
 */
export const LISTING_STATUS_CONFIG: Record<
  ListingStatus,
  { labelKey: string; className: string }
> = {
  [ListingStatus.DRAFT]: {
    labelKey: 'status.draft',
    className: 'bg-gray-100 text-gray-600',
  },
  [ListingStatus.PENDING]: {
    labelKey: 'status.pending',
    className: 'bg-yellow-50 text-yellow-600',
  },
  [ListingStatus.PUBLISHED]: {
    labelKey: 'status.published',
    className: 'bg-purple-94 text-main-primary',
  },
  [ListingStatus.SOLD]: {
    labelKey: 'status.sold',
    className: 'bg-green-50 text-green-600',
  },
  [ListingStatus.RENTED]: {
    labelKey: 'status.rented',
    className: 'bg-green-50 text-green-600',
  },
  [ListingStatus.ARCHIVED]: {
    labelKey: 'status.archived',
    className: 'bg-gray-100 text-gray-600',
  },
};

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
  // Address fields
  street_address?: string;
  ward_name?: string;
  district_name?: string;
  city_name?: string;
  full_address?: string;
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
