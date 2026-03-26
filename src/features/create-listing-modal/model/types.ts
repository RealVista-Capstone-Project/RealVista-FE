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
  displayOrder: number;
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

export type RepresentingType = 'landlord' | 'applicant';

export type CreateListingStep = 'request' | 'listing-information';

export type ListingType = 'RENT' | 'SALE';

/**
 * Form data for creating a listing.
 * Aligned with CreateListingRequest.java:
 *   propertyId, listingType, name, price, minPrice, maxPrice, isNegotiable, availableFrom
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
  primaryMediaId?: string;
}
