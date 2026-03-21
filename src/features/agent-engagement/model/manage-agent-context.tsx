'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useHiredAgentsQuery } from '../hooks/use-hired-agents';
import type { AgentEngagement } from '@/entities/agent-engagement';

const ITEMS_PER_PAGE = 10;

interface ManageAgentContextValue {
  agents: AgentEngagement[];
  isLoading: boolean;
  isError: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  selectedAgent: AgentEngagement | null;
  setSelectedAgent: (agent: AgentEngagement | null) => void;
  totalPages: number;
  totalElements: number;
  ITEMS_PER_PAGE: number;
  handleAgentClick: (agent: AgentEngagement) => void;
}

const ManageAgentContext = createContext<ManageAgentContextValue | null>(null);

export function ManageAgentProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<AgentEngagement | null>(null);

  const queryParams = useMemo(
    () => ({
      page: currentPage - 1, // API is 0-indexed
      size: ITEMS_PER_PAGE,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchQuery || undefined,
    }),
    [currentPage, statusFilter, searchQuery]
  );

  const { data, isLoading, isError } = useHiredAgentsQuery(queryParams);

  const pageData = data?.payload?.data;
  const agents = useMemo(() => pageData?.content ?? [], [pageData?.content]);
  const totalPages = pageData?.total_pages ?? 0;
  const totalElements = pageData?.total_elements ?? 0;

  const handleAgentClick = useCallback(
    (agent: AgentEngagement) => {
      setSelectedAgent((prev) =>
        prev?.engagement_id === agent.engagement_id ? null : agent
      );
    },
    []
  );

  const value = useMemo<ManageAgentContextValue>(
    () => ({
      agents,
      isLoading,
      isError,
      searchQuery,
      setSearchQuery: (q: string) => {
        setSearchQuery(q);
        setCurrentPage(1);
      },
      statusFilter,
      setStatusFilter: (s: string) => {
        setStatusFilter(s);
        setCurrentPage(1);
      },
      currentPage,
      setCurrentPage,
      selectedAgent,
      setSelectedAgent,
      totalPages,
      totalElements,
      ITEMS_PER_PAGE,
      handleAgentClick,
    }),
    [
      agents,
      isLoading,
      isError,
      searchQuery,
      statusFilter,
      currentPage,
      selectedAgent,
      totalPages,
      totalElements,
      handleAgentClick,
    ]
  );

  return (
    <ManageAgentContext.Provider value={value}>
      {children}
    </ManageAgentContext.Provider>
  );
}

export function useManageAgentContext() {
  const ctx = useContext(ManageAgentContext);
  if (!ctx) {
    throw new Error('useManageAgentContext must be used within ManageAgentProvider');
  }
  return ctx;
}
