/**
 * Types for the Create Listing Modal feature
 * Aligned with Property.java entity from the backend
 */

export type PropertyStatus = 'DRAFT' | 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface UserPropertyLocation {
  locationId: string;
  cityName: string;
  districtName: string;
  wardName: string;
}

export interface UserPropertyType {
  propertyTypeId: string;
  propertyTypeName: string;
  propertyTypeCode: string;
}

/**
 * Represents a property owned by the user.
 * Aligned with Property.java fields:
 *   propertyId, ownerId, locationId, propertyTypeId,
 *   streetAddress, latitude, longitude,
 *   landSizeM2, usableSizeM2, widthM, lengthM,
 *   status, descriptions, slug, extraAttributes
 */
export interface UserProperty {
  propertyId: string;
  ownerId: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
  landSizeM2: number | null;
  usableSizeM2: number | null;
  widthM: number | null;
  lengthM: number | null;
  status: PropertyStatus;
  descriptions: string | null;
  slug: string | null;
  thumbnailUrl: string | null;
  location: UserPropertyLocation;
  propertyType: UserPropertyType;
}

export type RepresentingType = 'landlord' | 'applicant';

export type CreateListingStep = 'request' | 'listing-information';
