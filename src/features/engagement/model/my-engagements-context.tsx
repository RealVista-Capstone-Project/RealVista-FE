import React, { createContext, useContext, useState, useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { Engagement, EngagementStatus } from '@/entities/engagement/model/types';
import { useMyEngagementsQuery, useCancelEngagementMutation } from '../hooks/use-my-engagements';

const ITEMS_PER_PAGE = 7;

interface MyEngagementsContextValue {
  engagements: Engagement[] | undefined;
  isLoading: boolean;
  isError: boolean;
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
  handleCancel: (id: string) => void;
  handleEngagementClick: (engagement: Engagement) => void;
}

const MyEngagementsContext = createContext<MyEngagementsContextValue | undefined>(undefined);

export const MyEngagementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: engagements, isLoading, isError } = useMyEngagementsQuery();
  const cancelMutation = useCancelEngagementMutation(() => setSelectedEngagement(null));

  const handleCancel = (id: string) => {
    cancelMutation.mutate(id);
  };

  const handleEngagementClick = (engagement: Engagement) => {
    const isSame = selectedEngagement?.engagementId === engagement.engagementId;
    if (isSame) {
      setSelectedEngagement(null);
    } else {
      setSelectedEngagement(engagement);
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
        const matchesSearch =
          eng.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          eng.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase());

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
          matchesStatus = eng.status === statusFilter.toUpperCase();
        }

        return matchesSearch && matchesDate && matchesStatus;
      }) || []
    );
  }, [engagements, searchQuery, date, statusFilter]);

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
        handleEngagementClick,
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
