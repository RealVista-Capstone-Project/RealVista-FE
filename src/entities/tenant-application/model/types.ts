export enum TenantApplicationStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  SUBMITTED = 'SUBMITTED', // As per EngagementStatus in backend
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export interface TenantApplication {
  tenantApplicationId: string;
  userId: string;
  rentalProfileId: string;
  listingId: string;

  // DTO fields from backend
  title: string;          // Listing Name
  propertyAddress: string;
  propertyImageUrl: string;

  monthlyIncome?: number;
  moveInDate?: string;
  leaseTermMonths?: number;
  status: TenantApplicationStatus;
  note?: string;

  createdAt: string;
  updatedAt: string;
}

export interface TenantRentalProfile {
  profileId: string;
  userId: string;
  title: string;
  monthlyIncome?: number;
  moveInDate?: string;
  leaseTermMonths?: number;
  note?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
