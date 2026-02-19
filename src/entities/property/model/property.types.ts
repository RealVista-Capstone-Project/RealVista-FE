/**
 * Property entity types
 */

import type { Attribute, Amenity } from '@/entities/listing';
import type { CostBreakdown } from '@/shared/types';

export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  area: number;
  description: string;
  images: PropertyImage[];
  amenities: Amenity[]; // Full amenity objects from API
  attributes: Attribute[]; // Optional: for dynamic property specifications from backend
  location: {
    lat: number;
    lng: number;
  };
  agent: Agent;
  createdAt: string;
  updatedAt: string;
  costBreakdown?: CostBreakdown;
}

export interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string; // Optional thumbnail for video/3D tour previews
  alt: string;
  type: 'photo' | '3d-tour' | 'video';
  isPrimary: boolean;
}

export interface Agent {
  id: string;
  name: string;
  avatar?: string; // Optional - not always provided by API
  phone: string;
  email: string;
}

export interface PropertyDetailProps {
  property: Property;
}

// Re-export cost breakdown types for convenience
export type { CostBreakdown, CostFee, FeeType } from '@/shared/types';
