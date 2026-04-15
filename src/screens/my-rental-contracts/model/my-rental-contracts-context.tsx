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
import { useRenterContractsQuery, useAgentContractsQuery } from '@/features/rental-contract/hooks/use-rental-contracts';

const ITEMS_PER_PAGE = 10;

interface MyRentalContractsContextValue {
  contracts: RentalContract[];
  isLoading: boolean;
  isError: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  selectedContract: RentalContract | null;
  setSelectedContract: (contract: RentalContract | null) => void;
  totalPages: number;
  totalElements: number;
  itemsPerPage: number;
  handleContractClick: (contract: RentalContract) => void;
}

const MyRentalContractsContext = createContext<MyRentalContractsContextValue | null>(null);

export function MyRentalContractsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);

  const userId = session?.user?.id ?? '';
  const backendRoles: string[] = (session?.user as { backendRoles?: string[] })?.backendRoles ?? [];
  const isAgent = session?.user?.role === 'AGENT' || backendRoles.includes('AGENT');

  const queryParams = useMemo(
    () => ({
      page: currentPage - 1,
      size: ITEMS_PER_PAGE,
      status:
        statusFilter !== 'all' ? (statusFilter as RentalContractStatus) : undefined,
      search: searchQuery || undefined,
    }),
    [currentPage, searchQuery, statusFilter]
  );

  const renterResult = useRenterContractsQuery(
    { renterId: userId, ...queryParams },
    { enabled: Boolean(userId) && !isAgent }
  );

  const agentResult = useAgentContractsQuery(
    { agentId: userId, ...queryParams },
    { enabled: Boolean(userId) && isAgent }
  );

  const { data, isLoading, isError } = isAgent ? agentResult : renterResult;

  const pageData = data?.payload.data;
  const contracts = useMemo(() => pageData?.content ?? [], [pageData?.content]);
  const totalPages = pageData?.total_pages ?? 0;
  const totalElements = pageData?.total_elements ?? 0;

  const handleContractClick = useCallback((contract: RentalContract) => {
    setSelectedContract((previous) => (previous?.id === contract.id ? null : contract));
  }, []);

  const value = useMemo<MyRentalContractsContextValue>(
    () => ({
      contracts,
      isLoading,
      isError,
      searchQuery,
      setSearchQuery: (v: string) => {
        setSearchQuery(v);
        setCurrentPage(1);
      },
      statusFilter,
      setStatusFilter: (v: string) => {
        setStatusFilter(v);
        setCurrentPage(1);
      },
      currentPage,
      setCurrentPage,
      selectedContract,
      setSelectedContract,
      totalPages,
      totalElements,
      itemsPerPage: ITEMS_PER_PAGE,
      handleContractClick,
    }),
    [
      contracts,
      currentPage,
      handleContractClick,
      isError,
      isLoading,
      searchQuery,
      selectedContract,
      statusFilter,
      totalElements,
      totalPages,
    ]
  );

  return (
    <MyRentalContractsContext.Provider value={value}>
      {children}
    </MyRentalContractsContext.Provider>
  );
}

export function useMyRentalContractsContext() {
  const context = useContext(MyRentalContractsContext);

  if (!context) {
    throw new Error(
      'useMyRentalContractsContext must be used within MyRentalContractsProvider'
    );
  }

  return context;
}
