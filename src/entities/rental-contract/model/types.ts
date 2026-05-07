export enum RentalContractStatus {
  DRAFT = 'DRAFT',
  PENDING_RENTER = 'PENDING_RENTER',
  PENDING_LANDLORD = 'PENDING_LANDLORD',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export type SignedDocumentStatus =
  | 'NOT_REQUESTED'
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

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
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
}

export interface RentalContract {
  id: string;
  listing_id: string;
  owner_id: string;
  agent_id?: string | null;
  landlordName?: string;
  landlordEmail?: string;
  landlordPhone?: string | null;
  landlordAvatarUrl?: string | null;
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
  signedDocumentUrl?: string | null;
  signedDocumentStatus?: SignedDocumentStatus | null;
  signedDocumentError?: string | null;
  signedDocumentProcessedAt?: string | null;
}

export interface LeaseResponse {
  lease_agreement_id: string;
  property_id: string;
  renter_id: string;
  landlord_id: string;
  agent_id: string | null;
  lease_start_date: string;
  lease_end_date: string;
  lease_duration_months: number;
  monthly_rent: number;
  security_deposit: number;
  status: string;
  created_at: string;
  updated_at: string;
  renter_full_name: string;
  renter_email: string;
  renter_phone: string | null;
  renter_avatar_url: string | null;
  landlord_full_name: string;
  landlord_email: string;
  landlord_phone: string | null;
  landlord_avatar_url: string | null;
  property_title: string;
  property_address: string;
  property_type: string;
  property_thumbnail_url: string | null;
  property_image_url: string | null;
  lease_document_url: string | null;
  signed_by_renter_at: string | null;
  signed_by_landlord_at: string | null;
  reject_reason: string | null;
  termination_reason: string | null;
  terminated_at: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  verified_by: string | null;
  docusign_envelope_id: string | null;
  docusign_status: string | null;
  signed_document_url?: string | null;
  signed_document_status?: SignedDocumentStatus | null;
  signed_document_error?: string | null;
  signed_document_processed_at?: string | null;
}

export interface LeasesApiResponse {
  success: boolean;
  message: string;
  data: {
    content: LeaseResponse[];
    page: number;
    size: number;
    total_elements: number;
    total_pages: number;
    first: boolean;
    last: boolean;
  };
  timestamp: string;
}

export interface LeaseApiResponse {
  success: boolean;
  message: string;
  data: LeaseResponse;
  timestamp: string;
}

export type CancelLeaseRequest = {
  reason?: string;
};

export type CancelLeaseResponse = LeaseApiResponse;

export type ConfirmLandlordSignedResponse = LeaseApiResponse;

/** Raw body sent to POST /api/v1/leases */
export interface CreateLeaseRequest {
  property_id: string;
  renter_id: string;
  landlord_id: string;
  agent_id?: string | null;
  lease_start_date: string;
  lease_end_date: string;
  lease_duration_months: number;
  monthly_rent: number;
  security_deposit: number;
  lease_document_url?: string | null;
}

/** Response from POST /api/v1/leases/{id}/send-landlord and send-renter */
export interface DocuSignSigningResponse {
  signing_url: string;
  envelope_id: string;
  signer_role: string;
}

export interface DocuSignApiResponse {
  success: boolean;
  message: string;
  data: DocuSignSigningResponse;
  timestamp: string;
}

/** Kept for backward compat with create wizard form logic */
export interface CreateRentalContractPayload {
  listing_id: string;
  property: RentalContractProperty;
  tenant: RentalContractTenant;
  /** ID of the tenant/renter user */
  tenantUserId: string;
  /** ID of the property owner (from property.owner_id) — never the agent */
  landlordId: string;
  /** ID of the agent who initiated the contract on behalf of the owner (optional) */
  agentId?: string | null;
  monthlyRent: number;
  securityAmount?: number;
  startDate: string;
  endDate: string;
}

export interface GetRentalContractsParams {
  landlordId: string;
  page?: number;
  size?: number;
  status?: RentalContractStatus;
  search?: string;
}

export interface GetRenterContractsParams {
  renterId: string;
  page?: number;
  size?: number;
  status?: RentalContractStatus;
  search?: string;
}

export interface GetAgentContractsParams {
  agentId: string;
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
    | RentalContractStatus.PENDING_RENTER
    | RentalContractStatus.ACTIVE
    | RentalContractStatus.TERMINATED;
  reason?: string;
}
