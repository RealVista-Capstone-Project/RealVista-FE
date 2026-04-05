import http from '@/shared/lib/http';
import {
  RentalContractStatus,
  type CreateRentalContractPayload,
  type GetRentalContractsParams,
  type LeaseResponse,
  type LeasesApiResponse,
  type RentalContract,
  type RentalContractPageResponse,
  type UpdateRentalContractStatusPayload,
} from '../model/types';

// ---------------------------------------------------------------------------
// Mapper — raw BE lease → FE RentalContract
// ---------------------------------------------------------------------------
function mapLeaseToContract(lease: LeaseResponse): RentalContract {
  return {
    id: lease.lease_agreement_id,
    listing_id: lease.property_id,
    owner_id: lease.landlord_id,
    agent_id: lease.agent_id,
    tenant: {
      id: lease.renter_id,
      fullName: lease.renter_full_name,
      email: lease.renter_email,
      phoneNumber: lease.renter_phone,
      avatarUrl: null,
    },
    property: {
      id: lease.property_id,
      title: lease.property_title,
      address: lease.property_address,
      listingType: lease.property_type,
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
    terminationReason: lease.reject_reason,
    paymentDueDay: null,
    specialClauses: null,
  };
}

// ---------------------------------------------------------------------------
// Mock helpers — kept for updateRentalContractStatus and createRentalContract
// ---------------------------------------------------------------------------
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const nextContractId = () => `rc-${Date.now()}`;

// In-memory store used only by the two mock mutations so detail panel updates
// are reflected immediately in the UI without a refetch.
const mutationStore: Map<string, RentalContract> = new Map();

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export const rentalContractApi = {
  async getRentalContracts(
    params: GetRentalContractsParams
  ): Promise<{ payload: { data: RentalContractPageResponse } }> {
    const { landlordId, page = 0, size = 10 } = params;

    const result = await http.get<LeasesApiResponse>(
      `/leases/landlord/${landlordId}`
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

  async updateRentalContractStatus({
    contractId,
    status,
    reason,
  }: UpdateRentalContractStatusPayload): Promise<RentalContract> {
    await wait(180);

    const stored = mutationStore.get(contractId);
    if (!stored) {
      throw new Error('Rental contract not found in local store');
    }

    const updated: RentalContract = {
      ...stored,
      status,
      updatedAt: new Date().toISOString(),
      sentForSigningAt:
        status === RentalContractStatus.PENDING_RENTER
          ? new Date().toISOString()
          : stored.sentForSigningAt ?? null,
      docusignEnvelopeId:
        status === RentalContractStatus.PENDING_RENTER
          ? stored.docusignEnvelopeId ?? `env-${contractId}`
          : stored.docusignEnvelopeId ?? null,
      ownerSignedAt:
        status === RentalContractStatus.ACTIVE
          ? stored.ownerSignedAt ?? new Date().toISOString()
          : stored.ownerSignedAt ?? null,
      tenantSignedAt:
        status === RentalContractStatus.ACTIVE
          ? stored.tenantSignedAt ?? new Date().toISOString()
          : stored.tenantSignedAt ?? null,
      terminationReason:
        status === RentalContractStatus.TERMINATED
          ? reason ?? null
          : stored.terminationReason ?? null,
    };

    mutationStore.set(contractId, updated);

    return updated;
  },

  async createRentalContract(payload: CreateRentalContractPayload): Promise<RentalContract> {
    await wait(180);

    const now = new Date().toISOString();
    const contract: RentalContract = {
      id: nextContractId(),
      listing_id: payload.listing_id,
      owner_id: 'owner-current-session',
      agent_id: null,
      property: payload.property,
      tenant: payload.tenant,
      monthlyRent: payload.monthlyRent,
      securityDeposit: payload.securityAmount ?? null,
      leaseStartDate: payload.startDate,
      leaseEndDate: payload.endDate,
      paymentDueDay: null,
      specialClauses: null,
      status: payload.status,
      contractDocumentUrl:
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
      createdAt: now,
      updatedAt: now,
      docusignEnvelopeId:
        payload.status === RentalContractStatus.PENDING_RENTER ? `env-${Date.now()}` : null,
      sentForSigningAt: payload.status === RentalContractStatus.PENDING_RENTER ? now : null,
      ownerSignedAt: null,
      tenantSignedAt: null,
      terminationReason: null,
    };

    mutationStore.set(contract.id, contract);

    return contract;
  },
};
