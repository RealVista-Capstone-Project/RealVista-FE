/**
 * Cost breakdown types for pricing information
 * These are shared domain concepts used across listing, property, and pricing features
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
