/**
 * Property entity types
 */

import type { Attribute } from '@/entities/listing';

export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  area: number;
  description: string;
  images: PropertyImage[];
  amenities: string[];
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
  avatar: string;
  phone: string;
  email: string;
}

export interface PropertyDetailProps {
  property: Property;
}

/**
 * Cost breakdown types from API
 */
export interface CostBreakdown {
  basePrice: number;
  basePriceUnit: string;
  requiredFees: CostFee[];
  requiredFeesSubtotal: number;
  optionalFees: CostFee[];
  optionalFeesSubtotal: number;
  totalCost: number;
  disclaimer: string;
}

export interface CostFee {
  name: string;
  amount: number;
  feeType: FeeType;
}

export type FeeType =
  | 'GARBAGE'
  | 'MANAGEMENT'
  | 'SECURITY'
  | 'WATER'
  | 'INTERNET'
  | 'PARKING'
  | 'ELECTRICITY'
  | 'OTHER';
