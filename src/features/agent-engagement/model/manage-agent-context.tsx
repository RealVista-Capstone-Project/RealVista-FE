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
  // Mock state helpers — replace with real mutation callbacks when BE is ready
  updateAgentStatus: (engagementId: string, newStatus: string) => void;
  markAgentReviewed: (engagementId: string) => void;
}

const ManageAgentContext = createContext<ManageAgentContextValue | null>(null);

export function ManageAgentProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<AgentEngagement | null>(null);

  // Mock local overrides — keyed by engagement_id
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [reviewedEngagements, setReviewedEngagements] = useState<Set<string>>(new Set());

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

  // Apply local overrides on top of server data
  const agents = useMemo(() => {
    const raw = pageData?.content ?? [];
    return raw.map((agent) => ({
      ...agent,
      status: statusOverrides[agent.engagement_id] ?? agent.status,
      has_review: reviewedEngagements.has(agent.engagement_id) ? true : (agent.has_review ?? false),
    }));
  }, [pageData?.content, statusOverrides, reviewedEngagements]);

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

  /**
   * Mock: update status locally.
   * Also syncs the selectedAgent so the detail panel re-renders.
   * TODO: remove local override after real API mutation + query invalidation.
   */
  const updateAgentStatus = useCallback((engagementId: string, newStatus: string) => {
    setStatusOverrides((prev) => ({ ...prev, [engagementId]: newStatus }));
    setSelectedAgent((prev) => {
      if (!prev || prev.engagement_id !== engagementId) return prev;
      return { ...prev, status: newStatus };
    });
  }, []);

  /**
   * Mock: mark engagement as reviewed locally.
   * TODO: remove after real API mutation + query invalidation.
   */
  const markAgentReviewed = useCallback((engagementId: string) => {
    setReviewedEngagements((prev) => new Set(prev).add(engagementId));
    setSelectedAgent((prev) => {
      if (!prev || prev.engagement_id !== engagementId) return prev;
      return { ...prev, has_review: true };
    });
  }, []);

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
      updateAgentStatus,
      markAgentReviewed,
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
      updateAgentStatus,
      markAgentReviewed,
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
