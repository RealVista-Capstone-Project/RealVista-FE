export enum RentalContractStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export interface RentalContractTenant {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface RentalContractProperty {
  id: string;
  title: string;
  address: string;
}

export interface RentalContract {
  id: string;
  tenant: RentalContractTenant;
  property: RentalContractProperty;
  monthlyRent: number;
  leaseStartDate: string;
  leaseEndDate: string;
  status: RentalContractStatus;
  contractDocumentUrl: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string | null;
  terminationReason?: string | null;
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
  status: RentalContractStatus.ACTIVE | RentalContractStatus.REJECTED | RentalContractStatus.TERMINATED;
  reason?: string;
}
