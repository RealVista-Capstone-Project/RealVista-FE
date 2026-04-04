import {
  RentalContractStatus,
  type GetRentalContractsParams,
  type RentalContract,
  type RentalContractPageResponse,
  type UpdateRentalContractStatusPayload,
} from '../model/types';

const MOCK_RENTAL_CONTRACTS: RentalContract[] = [
  {
    id: 'rc-1001',
    tenant: {
      id: 'tenant-1001',
      fullName: 'Mina Hoang',
      email: 'mina.hoang@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    },
    property: {
      id: 'property-201',
      title: 'Skyline Riverside Residence',
      address: '12 Nguyen Huu Canh, Binh Thanh, Ho Chi Minh City',
    },
    monthlyRent: 18500000,
    leaseStartDate: '2026-04-01',
    leaseEndDate: '2027-03-31',
    status: RentalContractStatus.PENDING,
    contractDocumentUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-03-28T08:30:00.000Z',
    updatedAt: '2026-03-30T10:00:00.000Z',
  },
  {
    id: 'rc-1002',
    tenant: {
      id: 'tenant-1002',
      fullName: 'Daniel Pham',
      email: 'daniel.pham@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
    property: {
      id: 'property-202',
      title: 'The Orchard Corner Loft',
      address: '88 Le Thanh Ton, District 1, Ho Chi Minh City',
    },
    monthlyRent: 24500000,
    leaseStartDate: '2026-02-15',
    leaseEndDate: '2027-02-14',
    status: RentalContractStatus.ACTIVE,
    contractDocumentUrl:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-02-02T03:15:00.000Z',
    updatedAt: '2026-03-10T11:45:00.000Z',
  },
  {
    id: 'rc-1003',
    tenant: {
      id: 'tenant-1003',
      fullName: 'Anh Thu Tran',
      email: 'anhthu.tran@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    },
    property: {
      id: 'property-203',
      title: 'Canal View Studio',
      address: '21 Tran Xuan Soan, District 7, Ho Chi Minh City',
    },
    monthlyRent: 12900000,
    leaseStartDate: '2025-01-01',
    leaseEndDate: '2025-12-31',
    status: RentalContractStatus.EXPIRED,
    contractDocumentUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2024-12-11T06:20:00.000Z',
    updatedAt: '2025-12-31T23:59:00.000Z',
  },
  {
    id: 'rc-1004',
    tenant: {
      id: 'tenant-1004',
      fullName: 'Lucas Nguyen',
      email: 'lucas.nguyen@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    },
    property: {
      id: 'property-204',
      title: 'Minimalist Pearl Apartment',
      address: '55 Vo Van Kiet, District 5, Ho Chi Minh City',
    },
    monthlyRent: 16200000,
    leaseStartDate: '2026-01-10',
    leaseEndDate: '2026-12-31',
    status: RentalContractStatus.TERMINATED,
    contractDocumentUrl:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2025-12-22T12:00:00.000Z',
    updatedAt: '2026-02-20T08:00:00.000Z',
    terminationReason: 'Tenant requested an early move-out after a company transfer.',
  },
  {
    id: 'rc-1005',
    tenant: {
      id: 'tenant-1005',
      fullName: 'Sophie Le',
      email: 'sophie.le@example.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80',
    },
    property: {
      id: 'property-205',
      title: 'Elmwood Family Duplex',
      address: '3A Thao Dien, Thu Duc City, Ho Chi Minh City',
    },
    monthlyRent: 31200000,
    leaseStartDate: '2026-05-01',
    leaseEndDate: '2027-04-30',
    status: RentalContractStatus.REJECTED,
    contractDocumentUrl:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-03-12T09:10:00.000Z',
    updatedAt: '2026-03-13T09:00:00.000Z',
    rejectionReason: 'Missing income verification in the submitted contract package.',
  },
];

let rentalContractsStore = [...MOCK_RENTAL_CONTRACTS];

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
      rejectionReason: status === RentalContractStatus.REJECTED ? reason ?? null : current.rejectionReason ?? null,
      terminationReason:
        status === RentalContractStatus.TERMINATED ? reason ?? null : current.terminationReason ?? null,
    };

    rentalContractsStore[index] = updated;

    return updated;
  },
};
