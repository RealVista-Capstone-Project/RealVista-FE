/**
 * Property entity types
 */

export interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  images: PropertyImage[];
  amenities: string[];
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
