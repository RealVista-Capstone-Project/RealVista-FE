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
