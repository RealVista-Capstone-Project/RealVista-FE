/**
 * Types for the Create Listing Modal feature
 * Aligned with PropertySummaryResponse from the backend
 */

export type PropertyStatus = 'DRAFT' | 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface UserPropertyLocation {
  locationId: string;
  cityName: string;
  districtName: string;
  wardName: string;
  latitude: number | null;
  longitude: number | null;
}

export interface UserPropertyType {
  propertyTypeId: string;
  propertyTypeName: string;
  propertyTypeCode: string;
  propertyCategoryName: string;
  propertyCategoryCode: string;
}

export interface UserPropertyAttribute {
  attributeId: string;
  attributeCode: string;
  attributeName: string;
  dataType: string;
  icon: string | null;
  unit: string | null;
  valueNumber: number | null;
  valueText: string | null;
  valueBoolean: boolean | null;
  displayValue: string | null;
}

export interface UserPropertyMedia {
  mediaId: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  isPrimary: boolean;
  isPropertyStandard: boolean;
  displayOrder: number;
  roomName?: string | null;
}

export interface UserPropertyAmenity {
  amenityId: string;
  amenityName: string;
}

/**
 * Represents a property owned by the user.
 * Aligned with PropertySummaryResponse fields.
 */
export interface UserProperty {
  propertyId: string;
  streetAddress: string;
  landSizeM2: number | null;
  usableSizeM2: number | null;
  widthM: number | null;
  lengthM: number | null;
  areaSqft: number | null;
  description: string | null;
  status: PropertyStatus;
  thumbnailUrl: string | null;
  location: UserPropertyLocation;
  propertyType: UserPropertyType;
  attributes: UserPropertyAttribute[];
  amenities: UserPropertyAmenity[];
  media: UserPropertyMedia[];
}

export type CreateListingStep = 'request' | 'listing-information';

export type ListingType = 'RENT' | 'SALE';

/**
 * Form data for creating a listing (camelCase, used in the form UI).
 */
export interface CreateListingFormData {
  propertyId: string;
  listingType: ListingType;
  name: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  isNegotiable: boolean;
  availableFrom: string;
  content: string;
  selectedMediaIds: string[];
  primaryMediaId?: string;
  newFiles?: File[];
  shouldPublish: boolean;
}

/**
 * API payload for creating a listing.
 * Uses snake_case to match backend Jackson PropertyNamingStrategies.SNAKE_CASE.
 */
export interface CreateListingPayload {
  property_id: string;
  listing_type: 'RENT' | 'SALE';
  name: string;
  price: number;
  min_price?: number | null;
  max_price?: number | null;
  is_negotiable: boolean;
  available_from?: string | null;
  content?: string | null;
  media_ids?: string[];
  primary_media_id?: string | null;
  should_publish: boolean;
  new_medias?: Array<{
    url: string;
    type: string;
    isPrimary: boolean;
    thumbnailUrl?: string;
  }>;
}
