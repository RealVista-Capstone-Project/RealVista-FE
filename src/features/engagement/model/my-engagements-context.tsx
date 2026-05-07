'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { isSameDay } from 'date-fns';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Engagement, EngagementStatus } from '@/entities/engagement/model/types';
import {
  useMyEngagementsQuery,
  useCancelEngagementMutation,
  useFinishEngagementMutation,
  useAcceptEngagementMutation,
  useRejectEngagementMutation,
} from '../hooks/use-my-engagements';
import { useAuthSession } from '@/features/auth/model';
import { EngagementTab } from '../ui/engagement-search-header';

const ITEMS_PER_PAGE = 7;

interface MyEngagementsContextValue {
  engagements: Engagement[] | undefined;
  isLoading: boolean;
  isError: boolean;
  tab: EngagementTab;
  setTab: (tab: EngagementTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  selectedEngagement: Engagement | null;
  setSelectedEngagement: React.Dispatch<React.SetStateAction<Engagement | null>>;
  filteredEngagements: Engagement[];
  paginatedEngagements: Engagement[];
  totalPages: number;
  ITEMS_PER_PAGE: number;
  handleCancel: (id: string, reason?: string) => void;
  handleFinish: (id: string) => void;
  handleAccept: (id: string) => void;
  handleReject: (id: string) => void;
  handleEngagementClick: (engagement: Engagement) => void;
  currentUserId?: string;
}

const MyEngagementsContext = createContext<MyEngagementsContextValue | undefined>(undefined);

export const MyEngagementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState<EngagementTab>('all');

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const preselectedId = searchParams.get('engagementId');
  const hasAutoSelected = useRef(false);

  const { data: session } = useAuthSession();
  const currentUserId = session?.user?.id;

  const { data: engagements, isLoading, isError } = useMyEngagementsQuery();

  // Sync URL when selection changes manually or via mutations
  const syncUrlWithSelection = (engagementId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (engagementId) {
      params.set('engagementId', engagementId);
    } else {
      params.delete('engagementId');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Auto-select engagement from URL param once data is loaded (only runs once)
  useEffect(() => {
    if (hasAutoSelected.current || !preselectedId || !engagements) return;

    const match = engagements.find((e) => e.engagementId === preselectedId);
    if (match) {
      setSelectedEngagement(match);
      hasAutoSelected.current = true;
      // Switch to correct tab based on whether user sent or received it
      if (currentUserId) {
        setTab(match.initiatorId === currentUserId ? 'sent' : 'received');
      }
      setTimeout(() => {
        const panel = document.getElementById('engagement-detail-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
    }
  }, [preselectedId, engagements, currentUserId]);

  const cancelMutation = useCancelEngagementMutation(() => {
    setSelectedEngagement(null);
    syncUrlWithSelection(null);
  });
  const finishMutation = useFinishEngagementMutation(() => {
    setSelectedEngagement(null);
    syncUrlWithSelection(null);
  });
  const acceptMutation = useAcceptEngagementMutation(() => {
    setSelectedEngagement(null);
    syncUrlWithSelection(null);
  });
  const rejectMutation = useRejectEngagementMutation(() => {
    setSelectedEngagement(null);
    syncUrlWithSelection(null);
  });

  const handleCancel = (id: string, reason?: string) => {
    cancelMutation.mutate({ id, reason });
  };

  const handleFinish = (id: string) => {
    finishMutation.mutate(id);
  };

  const handleAccept = (id: string) => {
    acceptMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(id);
  };

  const handleEngagementClick = (engagement: Engagement) => {
    const isSame = selectedEngagement?.engagementId === engagement.engagementId;
    if (isSame) {
      setSelectedEngagement(null);
      syncUrlWithSelection(null);
    } else {
      setSelectedEngagement(engagement);
      syncUrlWithSelection(engagement.engagementId);
      setTimeout(() => {
        const panel = document.getElementById('engagement-detail-panel');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  const filteredEngagements = useMemo(() => {
    return (
      engagements?.filter((eng: Engagement) => {
        // Direction filter: sent = current user is initiator, received = current user is receiver,
        // all = no direction restriction.
        if (currentUserId) {
          if (tab === 'sent' && eng.initiatorId !== currentUserId) return false;
          else if (tab === 'received' && eng.receiverId !== currentUserId) return false;
        }

        const matchesSearch =
          !searchQuery ||
          eng.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          eng.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          eng.agentFullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          eng.initiatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          eng.receiverName?.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesDate = true;
        if (date) {
          try {
            const engDate = new Date(eng.createdAt);
            if (!isNaN(engDate.getTime())) {
              matchesDate = isSameDay(engDate, date);
            }
          } catch {
            matchesDate = false;
          }
        }

        let matchesStatus = true;
        if (statusFilter !== 'all') {
          matchesStatus = eng.status === (statusFilter as EngagementStatus);
        }

        return matchesSearch && matchesDate && matchesStatus;
      }) || []
    );
  }, [engagements, searchQuery, date, statusFilter, tab, currentUserId]);

  const totalPages = Math.ceil(filteredEngagements.length / ITEMS_PER_PAGE);
  const paginatedEngagements = filteredEngagements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <MyEngagementsContext.Provider
      value={{
        engagements,
        isLoading,
        isError,
        tab,
        setTab,
        searchQuery,
        setSearchQuery,
        date,
        setDate,
        statusFilter,
        setStatusFilter,
        currentPage,
        setCurrentPage,
        selectedEngagement,
        setSelectedEngagement,
        filteredEngagements,
        paginatedEngagements,
        totalPages,
        ITEMS_PER_PAGE,
        handleCancel,
        handleFinish,
        handleAccept,
        handleReject,
        handleEngagementClick,
        currentUserId,
      }}
    >
      {children}
    </MyEngagementsContext.Provider>
  );
};

export const useMyEngagementsContext = () => {
  const context = useContext(MyEngagementsContext);
  if (context === undefined) {
    throw new Error('useMyEngagementsContext must be used within a MyEngagementsProvider');
  }
  return context;
};
