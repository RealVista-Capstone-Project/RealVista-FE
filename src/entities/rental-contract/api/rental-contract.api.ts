import http from '@/shared/lib/http';
import {
  RentalContractStatus,
  type CancelLeaseRequest,
  type CreateLeaseRequest,
  type CreateRentalContractPayload,
  type DocuSignApiResponse,
  type DocuSignSigningResponse,
  type GetAgentContractsParams,
  type GetRentalContractsParams,
  type GetRenterContractsParams,
  type LeaseApiResponse,
  type LeaseResponse,
  type LeasesApiResponse,
  type RentalContract,
  type RentalContractPageResponse,
  type UpdateRentalContractStatusPayload,
} from '../model/types';

// ---------------------------------------------------------------------------
// Mapper — raw BE lease → FE RentalContract
// ---------------------------------------------------------------------------
export function mapLeaseToContract(lease: LeaseResponse): RentalContract {
  return {
    id: lease.lease_agreement_id,
    listing_id: lease.property_id,
    owner_id: lease.landlord_id,
    agent_id: lease.agent_id,
    landlordName: lease.landlord_full_name,
    landlordEmail: lease.landlord_email,
    landlordPhone: lease.landlord_phone,
    landlordAvatarUrl: lease.landlord_avatar_url,
    tenant: {
      id: lease.renter_id,
      fullName: lease.renter_full_name,
      email: lease.renter_email,
      phoneNumber: lease.renter_phone,
      avatarUrl: lease.renter_avatar_url ?? null,
    },
    property: {
      id: lease.property_id,
      title: lease.property_title,
      address: lease.property_address,
      listingType: lease.property_type,
      thumbnailUrl: lease.property_thumbnail_url ?? null,
      imageUrl: lease.property_image_url ?? null,
    },
    monthlyRent: lease.monthly_rent,
    securityDeposit: lease.security_deposit,
    leaseStartDate: lease.lease_start_date,
    leaseEndDate: lease.lease_end_date,
    status: lease.status as RentalContractStatus,
    contractDocumentUrl: lease.lease_document_url ?? '',
    createdAt: lease.created_at,
    updatedAt: lease.updated_at,
    docusignEnvelopeId: lease.docusign_envelope_id,
    sentForSigningAt: null,
    ownerSignedAt: lease.signed_by_landlord_at,
    tenantSignedAt: lease.signed_by_renter_at,
    terminationReason: lease.termination_reason ?? lease.cancel_reason ?? lease.reject_reason,
    signedDocumentUrl: lease.signed_document_url ?? null,
    signedDocumentStatus: lease.signed_document_status ?? null,
    signedDocumentError: lease.signed_document_error ?? null,
    signedDocumentProcessedAt: lease.signed_document_processed_at ?? null,
    paymentDueDay: null,
    specialClauses: null,
  };
}

// ---------------------------------------------------------------------------
// Helper — compute lease_duration_months from date strings
// ---------------------------------------------------------------------------
function calcDurationMonths(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(1, months);
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export const rentalContractApi = {
  // ── List ─────────────────────────────────────────────────────────────────
  async getRentalContracts(
    params: GetRentalContractsParams
  ): Promise<{ payload: { data: RentalContractPageResponse } }> {
    const { landlordId, page = 0, size = 10, status } = params;

    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set('status', status);

    const result = await http.get<LeasesApiResponse>(
      `/leases/landlord/${landlordId}?${query.toString()}`
    );

    const apiData = result.payload.data;
    const mapped = apiData.content.map(mapLeaseToContract);

    return {
      payload: {
        data: {
          content: mapped,
          page: apiData.page,
          size: apiData.size,
          total_elements: apiData.total_elements,
          total_pages: apiData.total_pages,
          first: apiData.first,
          last: apiData.last,
        },
      },
    };
  },

  // ── Detail ───────────────────────────────────────────────────────────────
  async getRentalContractById(leaseId: string): Promise<RentalContract> {
    const result = await http.get<LeaseApiResponse>(`/leases/${leaseId}`);
    return mapLeaseToContract(result.payload.data);
  },

  // ── Create draft ─────────────────────────────────────────────────────────
  async createRentalContract(payload: CreateRentalContractPayload): Promise<RentalContract> {
    const body: CreateLeaseRequest = {
      property_id: payload.listing_id,
      renter_id: payload.tenantUserId,
      landlord_id: payload.landlordId,
      agent_id: payload.agentId ?? null,
      lease_start_date: payload.startDate,
      lease_end_date: payload.endDate,
      lease_duration_months: calcDurationMonths(payload.startDate, payload.endDate),
      monthly_rent: payload.monthlyRent,
      security_deposit: payload.securityAmount ?? 0,
      lease_document_url: null,
    };

    const result = await http.post<LeaseApiResponse>('/leases', body);
    return mapLeaseToContract(result.payload.data);
  },

  // ── DocuSign — Step 1: landlord signs first ───────────────────────────────
  async sendToLandlordForSigning(
    leaseId: string,
    returnUrl?: string
  ): Promise<DocuSignSigningResponse> {
    const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    const result = await http.post<DocuSignApiResponse>(
      `/leases/${leaseId}/send-landlord${query}`,
      {}
    );
    return result.payload.data;
  },

  // ── DocuSign — Step 2: renter signs (lease must be PENDING_LANDLORD) ──────
  async sendToRenterForSigning(
    leaseId: string,
    returnUrl?: string
  ): Promise<DocuSignSigningResponse> {
    const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    const result = await http.post<DocuSignApiResponse>(
      `/leases/${leaseId}/send-renter${query}`,
      {}
    );
    return result.payload.data;
  },

  // ── List (renter side) ───────────────────────────────────────────────────
  async getRenterContracts(
    params: GetRenterContractsParams
  ): Promise<{ payload: { data: RentalContractPageResponse } }> {
    const { renterId, page = 0, size = 10, status } = params;

    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set('status', status);

    const result = await http.get<LeasesApiResponse>(
      `/leases/renter/${renterId}?${query.toString()}`
    );

    const apiData = result.payload.data;
    const mapped = apiData.content.map(mapLeaseToContract);

    return {
      payload: {
        data: {
          content: mapped,
          page: apiData.page,
          size: apiData.size,
          total_elements: apiData.total_elements,
          total_pages: apiData.total_pages,
          first: apiData.first,
          last: apiData.last,
        },
      },
    };
  },

  // ── List (agent side) ────────────────────────────────────────────────────
  async getAgentContracts(
    params: GetAgentContractsParams
  ): Promise<{ payload: { data: RentalContractPageResponse } }> {
    const { agentId, page = 0, size = 10, status } = params;

    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set('status', status);

    const result = await http.get<LeasesApiResponse>(
      `/leases/agent/${agentId}?${query.toString()}`
    );

    const apiData = result.payload.data;
    const mapped = apiData.content.map(mapLeaseToContract);

    return {
      payload: {
        data: {
          content: mapped,
          page: apiData.page,
          size: apiData.size,
          total_elements: apiData.total_elements,
          total_pages: apiData.total_pages,
          first: apiData.first,
          last: apiData.last,
        },
      },
    };
  },

  // ── Refresh signing URLs (expire after ~5 min) ───────────────────────────
  async getLandlordSigningUrl(
    leaseId: string,
    returnUrl?: string
  ): Promise<DocuSignSigningResponse> {
    const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    const result = await http.get<DocuSignApiResponse>(
      `/leases/${leaseId}/landlord-signing-url${query}`
    );
    return result.payload.data;
  },

  async getRenterSigningUrl(leaseId: string, returnUrl?: string): Promise<DocuSignSigningResponse> {
    const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    const result = await http.get<DocuSignApiResponse>(
      `/leases/${leaseId}/renter-signing-url${query}`
    );
    return result.payload.data;
  },

  // ── DocuSign — Step 1b: confirm landlord signed (after DocuSign redirect) ─
  async confirmLandlordSigned(leaseId: string): Promise<RentalContract> {
    const result = await http.post<LeaseApiResponse>(
      `/leases/${leaseId}/confirm-landlord-signed`,
      {}
    );
    return mapLeaseToContract(result.payload.data);
  },

  // ── Cancel ────────────────────────────────────────────────────────────────
  async cancelLease(leaseId: string, payload?: CancelLeaseRequest): Promise<RentalContract> {
    const body = payload?.reason ? { reason: payload.reason } : {};
    const result = await http.put<LeaseApiResponse>(`/leases/${leaseId}/cancel`, body);
    return mapLeaseToContract(result.payload.data);
  },

  // ── Terminate ─────────────────────────────────────────────────────────────
  async updateRentalContractStatus({
    contractId,
    status: _status,
    reason,
  }: UpdateRentalContractStatusPayload): Promise<RentalContract> {
    const body = reason ? { reason } : {};
    const result = await http.put<LeaseApiResponse>(`/leases/${contractId}/terminate`, body);
    return mapLeaseToContract(result.payload.data);
  },
};
