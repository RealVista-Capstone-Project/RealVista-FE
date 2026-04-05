export enum RentalContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export interface RentalContractTenant {
  id: string;
  user_id?: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
}

export interface RentalContractProperty {
  id: string;
  listing_id?: string;
  title: string;
  address: string;
  listingType?: string;
  bedrooms?: number;
  bathrooms?: number;
}

export interface RentalContract {
  id: string;
  listing_id: string;
  owner_id: string;
  agent_id?: string | null;
  tenant: RentalContractTenant;
  property: RentalContractProperty;
  monthlyRent: number;
  securityDeposit?: number | null;
  leaseStartDate: string;
  leaseEndDate: string;
  paymentDueDay?: number | null;
  specialClauses?: string | null;
  status: RentalContractStatus;
  contractDocumentUrl: string;
  createdAt: string;
  updatedAt: string;
  docusignEnvelopeId?: string | null;
  sentForSigningAt?: string | null;
  ownerSignedAt?: string | null;
  tenantSignedAt?: string | null;
  terminationReason?: string | null;
}

export interface CreateRentalContractPayload {
  listing_id: string;
  property: RentalContractProperty;
  tenant: RentalContractTenant;
  monthlyRent: number;
  securityAmount?: number;
  startDate: string;
  endDate: string;
  status: RentalContractStatus.DRAFT | RentalContractStatus.PENDING_SIGNATURE;
}

export interface GetRentalContractsParams {
  page?: number;
  size?: number;
  status?: RentalContractStatus;
  search?: string;
}

export interface RentalContractPageResponse {
  content: RentalContract[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
}

export interface UpdateRentalContractStatusPayload {
  contractId: string;
  status:
    | RentalContractStatus.PENDING_SIGNATURE
    | RentalContractStatus.ACTIVE
    | RentalContractStatus.TERMINATED;
  reason?: string;
}
