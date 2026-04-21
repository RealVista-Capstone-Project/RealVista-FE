'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  RentalContractStatus,
  type RentalContract,
} from '@/entities/rental-contract';
import { useRentalContractsQuery } from '../hooks/use-rental-contracts';

const ITEMS_PER_PAGE = 10;

interface ManageRentalContractContextValue {
  contracts: RentalContract[];
  isLoading: boolean;
  isError: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalElements: number;
  itemsPerPage: number;
}

const ManageRentalContractContext = createContext<ManageRentalContractContextValue | null>(null);

export function ManageRentalContractProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      landlordId: session?.user?.id ?? '',
      page: currentPage - 1,
      size: ITEMS_PER_PAGE,
      status:
        statusFilter !== 'all' ? (statusFilter as RentalContractStatus) : undefined,
      search: searchQuery || undefined,
    }),
    [currentPage, searchQuery, session?.user?.id, statusFilter]
  );

  const { data, isLoading, isError } = useRentalContractsQuery(queryParams, {
    enabled: Boolean(session?.user?.id),
  });

  const pageData = data?.payload.data;
  const contracts = useMemo(() => pageData?.content ?? [], [pageData?.content]);
  const totalPages = pageData?.total_pages ?? 0;
  const totalElements = pageData?.total_elements ?? 0;

  const value = useMemo<ManageRentalContractContextValue>(
    () => ({
      contracts,
      isLoading,
      isError,
      searchQuery,
      setSearchQuery: (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
      },
      statusFilter,
      setStatusFilter: (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
      },
      currentPage,
      setCurrentPage,
      totalPages,
      totalElements,
      itemsPerPage: ITEMS_PER_PAGE,
    }),
    [
      contracts,
      currentPage,
      isError,
      isLoading,
      searchQuery,
      statusFilter,
      totalElements,
      totalPages,
    ]
  );

  return (
    <ManageRentalContractContext.Provider value={value}>
      {children}
    </ManageRentalContractContext.Provider>
  );
}

export function useManageRentalContractContext() {
  const context = useContext(ManageRentalContractContext);

  if (!context) {
    throw new Error(
      'useManageRentalContractContext must be used within ManageRentalContractProvider'
    );
  }

  return context;
}