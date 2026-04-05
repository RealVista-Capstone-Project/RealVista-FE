import {
  RentalContractStatus,
  type CreateRentalContractPayload,
  type GetRentalContractsParams,
  type RentalContract,
  type RentalContractPageResponse,
  type UpdateRentalContractStatusPayload,
} from '../model/types';

const MOCK_RENTAL_CONTRACTS: RentalContract[] = [
  {
    id: 'rc-1001',
    listing_id: 'listing-201',
    owner_id: 'owner-301',
    agent_id: 'agent-701',
    tenant: {
      id: 'tenant-1001',
      user_id: 'user-1001',
      fullName: 'Mina Hoang',
      email: 'mina.hoang@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      phoneNumber: '+84 905 112 334',
    },
    property: {
      id: 'property-201',
      listing_id: 'listing-201',
      title: 'Skyline Riverside Residence',
      address: '12 Nguyen Huu Canh, Binh Thanh, Ho Chi Minh City',
      listingType: 'Apartment',
      bedrooms: 2,
      bathrooms: 2,
    },
    monthlyRent: 18500000,
    securityDeposit: 37000000,
    leaseStartDate: '2026-04-01',
    leaseEndDate: '2027-03-31',
    paymentDueDay: 5,
    specialClauses: 'No smoking indoors. Building access card replacement is charged at cost.',
    status: RentalContractStatus.DRAFT,
    contractDocumentUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-03-28T08:30:00.000Z',
    updatedAt: '2026-03-30T10:00:00.000Z',
    docusignEnvelopeId: null,
    sentForSigningAt: null,
    ownerSignedAt: null,
    tenantSignedAt: null,
  },
  {
    id: 'rc-1002',
    listing_id: 'listing-202',
    owner_id: 'owner-302',
    agent_id: 'agent-702',
    tenant: {
      id: 'tenant-1002',
      user_id: 'user-1002',
      fullName: 'Daniel Pham',
      email: 'daniel.pham@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      phoneNumber: '+84 903 512 991',
    },
    property: {
      id: 'property-202',
      listing_id: 'listing-202',
      title: 'The Orchard Corner Loft',
      address: '88 Le Thanh Ton, District 1, Ho Chi Minh City',
      listingType: 'Loft',
      bedrooms: 1,
      bathrooms: 1,
    },
    monthlyRent: 24500000,
    securityDeposit: 49000000,
    leaseStartDate: '2026-02-15',
    leaseEndDate: '2027-02-14',
    paymentDueDay: 1,
    specialClauses: 'Tenant covers electricity and internet. Cleaning service twice per month included.',
    status: RentalContractStatus.ACTIVE,
    contractDocumentUrl:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-02-02T03:15:00.000Z',
    updatedAt: '2026-03-10T11:45:00.000Z',
    docusignEnvelopeId: 'env-rc-1002',
    sentForSigningAt: '2026-02-03T09:30:00.000Z',
    ownerSignedAt: '2026-02-03T10:00:00.000Z',
    tenantSignedAt: '2026-02-04T07:20:00.000Z',
  },
  {
    id: 'rc-1003',
    listing_id: 'listing-203',
    owner_id: 'owner-303',
    agent_id: null,
    tenant: {
      id: 'tenant-1003',
      user_id: 'user-1003',
      fullName: 'Anh Thu Tran',
      email: 'anhthu.tran@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
      phoneNumber: '+84 909 770 224',
    },
    property: {
      id: 'property-203',
      listing_id: 'listing-203',
      title: 'Canal View Studio',
      address: '21 Tran Xuan Soan, District 7, Ho Chi Minh City',
      listingType: 'Studio',
      bedrooms: 1,
      bathrooms: 1,
    },
    monthlyRent: 12900000,
    securityDeposit: 25800000,
    leaseStartDate: '2025-01-01',
    leaseEndDate: '2025-12-31',
    paymentDueDay: 10,
    specialClauses: 'Maximum occupancy of two adults. Quiet hours after 10 PM.',
    status: RentalContractStatus.EXPIRED,
    contractDocumentUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2024-12-11T06:20:00.000Z',
    updatedAt: '2025-12-31T23:59:00.000Z',
    docusignEnvelopeId: 'env-rc-1003',
    sentForSigningAt: '2024-12-12T08:00:00.000Z',
    ownerSignedAt: '2024-12-12T08:20:00.000Z',
    tenantSignedAt: '2024-12-12T14:30:00.000Z',
  },
  {
    id: 'rc-1004',
    listing_id: 'listing-204',
    owner_id: 'owner-304',
    agent_id: 'agent-704',
    tenant: {
      id: 'tenant-1004',
      user_id: 'user-1004',
      fullName: 'Lucas Nguyen',
      email: 'lucas.nguyen@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      phoneNumber: '+84 901 660 110',
    },
    property: {
      id: 'property-204',
      listing_id: 'listing-204',
      title: 'Minimalist Pearl Apartment',
      address: '55 Vo Van Kiet, District 5, Ho Chi Minh City',
      listingType: 'Apartment',
      bedrooms: 2,
      bathrooms: 1,
    },
    monthlyRent: 16200000,
    securityDeposit: 32400000,
    leaseStartDate: '2026-01-10',
    leaseEndDate: '2026-12-31',
    paymentDueDay: 3,
    specialClauses: 'Parking slot included. Pets require owner approval in writing.',
    status: RentalContractStatus.TERMINATED,
    contractDocumentUrl:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2025-12-22T12:00:00.000Z',
    updatedAt: '2026-02-20T08:00:00.000Z',
    docusignEnvelopeId: 'env-rc-1004',
    sentForSigningAt: '2025-12-23T05:30:00.000Z',
    ownerSignedAt: '2025-12-23T07:00:00.000Z',
    tenantSignedAt: '2025-12-24T09:15:00.000Z',
    terminationReason: 'Tenant requested an early move-out after a company transfer.',
  },
  {
    id: 'rc-1005',
    listing_id: 'listing-205',
    owner_id: 'owner-305',
    agent_id: null,
    tenant: {
      id: 'tenant-1005',
      user_id: 'user-1005',
      fullName: 'Sophie Le',
      email: 'sophie.le@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80',
      phoneNumber: '+84 908 445 886',
    },
    property: {
      id: 'property-205',
      listing_id: 'listing-205',
      title: 'Elmwood Family Duplex',
      address: '3A Thao Dien, Thu Duc City, Ho Chi Minh City',
      listingType: 'Duplex',
      bedrooms: 3,
      bathrooms: 3,
    },
    monthlyRent: 31200000,
    securityDeposit: 62400000,
    leaseStartDate: '2026-05-01',
    leaseEndDate: '2027-04-30',
    paymentDueDay: 7,
    specialClauses: 'Garden maintenance is included. Subletting is not permitted.',
    status: RentalContractStatus.PENDING_SIGNATURE,
    contractDocumentUrl:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-03-12T09:10:00.000Z',
    updatedAt: '2026-03-13T09:00:00.000Z',
    docusignEnvelopeId: 'env-rc-1005',
    sentForSigningAt: '2026-03-12T12:00:00.000Z',
    ownerSignedAt: '2026-03-12T14:10:00.000Z',
    tenantSignedAt: null,
  },
];

const rentalContractsStore = [...MOCK_RENTAL_CONTRACTS];

const nextContractId = () => `rc-${Date.now()}`;

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const rentalContractApi = {
  async getRentalContracts(
    params: GetRentalContractsParams = {}
  ): Promise<{ payload: { data: RentalContractPageResponse } }> {
    await wait();

    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const search = params.search?.trim().toLowerCase();

    const filtered = rentalContractsStore.filter((contract) => {
      const matchesStatus = params.status ? contract.status === params.status : true;
      const matchesSearch = search
        ? [contract.tenant.fullName, contract.tenant.email, contract.property.title]
            .join(' ')
            .toLowerCase()
            .includes(search)
        : true;

      return matchesStatus && matchesSearch;
    });

    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);

    return {
      payload: {
        data: {
          content,
          page,
          size,
          total_elements: totalElements,
          total_pages: totalPages,
          first: page === 0,
          last: end >= totalElements,
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

    const index = rentalContractsStore.findIndex((contract) => contract.id === contractId);
    if (index === -1) {
      throw new Error('Rental contract not found');
    }

    const current = rentalContractsStore[index];

    const updated: RentalContract = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
      sentForSigningAt:
        status === RentalContractStatus.PENDING_SIGNATURE
          ? new Date().toISOString()
          : current.sentForSigningAt ?? null,
      docusignEnvelopeId:
        status === RentalContractStatus.PENDING_SIGNATURE
          ? current.docusignEnvelopeId ?? `env-${contractId}`
          : current.docusignEnvelopeId ?? null,
      ownerSignedAt:
        status === RentalContractStatus.ACTIVE ? current.ownerSignedAt ?? new Date().toISOString() : current.ownerSignedAt ?? null,
      tenantSignedAt:
        status === RentalContractStatus.ACTIVE ? current.tenantSignedAt ?? new Date().toISOString() : current.tenantSignedAt ?? null,
      terminationReason:
        status === RentalContractStatus.TERMINATED ? reason ?? null : current.terminationReason ?? null,
    };

    rentalContractsStore[index] = updated;

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
        payload.status === RentalContractStatus.PENDING_SIGNATURE ? `env-${Date.now()}` : null,
      sentForSigningAt: payload.status === RentalContractStatus.PENDING_SIGNATURE ? now : null,
      ownerSignedAt: null,
      tenantSignedAt: null,
      terminationReason: null,
    };

    rentalContractsStore.unshift(contract);

    return contract;
  },
};
