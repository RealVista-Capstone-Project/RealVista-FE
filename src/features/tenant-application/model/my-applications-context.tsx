import React, { createContext, useContext, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isSameDay } from 'date-fns';
import { TenantApplication } from '@/entities/tenant-application/model/types';
import { useMyApplicationsQuery, useDeleteApplicationMutation } from '../hooks/use-my-applications';

const ITEMS_PER_PAGE = 7;

interface MyApplicationsContextValue {
  applications: TenantApplication[] | undefined;
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
  selectedApp: TenantApplication | null;
  setSelectedApp: React.Dispatch<React.SetStateAction<TenantApplication | null>>;
  filteredApps: TenantApplication[];
  paginatedApps: TenantApplication[];
  totalPages: number;
  ITEMS_PER_PAGE: number;
  handleDelete: (id: string) => void;
  handleAppClick: (app: TenantApplication) => void;
}

const MyApplicationsContext = createContext<MyApplicationsContextValue | undefined>(undefined);

export const MyApplicationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedApp, setSelectedApp] = useState<TenantApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: applications, isLoading, isError } = useMyApplicationsQuery();
  const deleteMutation = useDeleteApplicationMutation(() => setSelectedApp(null));

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getAppId = (app: TenantApplication) => app.tenantApplicationId;

  const handleAppClick = (app: TenantApplication) => {
    const appId = getAppId(app);
    const selectedId = selectedApp ? getAppId(selectedApp) : null;

    if (selectedId === appId) {
      setSelectedApp(null);
    } else {
      setSelectedApp(app);
      setTimeout(() => {
        const detailPanel = document.getElementById('application-detail-panel');
        if (detailPanel) {
          detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  const filteredApps = useMemo(() => {
    return applications?.filter((app: TenantApplication) => {
      const matchesSearch =
        app.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = true;
      if (date) {
        try {
          const appDate = new Date(app.createdAt);
          if (!isNaN(appDate.getTime())) {
            matchesDate = isSameDay(appDate, date);
          }
        } catch {
          matchesDate = false;
        }
      }

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') matchesStatus = app.status === 'ACTIVE';
        if (statusFilter === 'draft') matchesStatus = app.status === 'DRAFT';
      }

      return matchesSearch && matchesDate && matchesStatus;
    }) || [];
  }, [applications, searchQuery, date, statusFilter]);

  const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE);
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <MyApplicationsContext.Provider
      value={{
        applications,
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
        selectedApp,
        setSelectedApp,
        filteredApps,
        paginatedApps,
        totalPages,
        ITEMS_PER_PAGE,
        handleDelete,
        handleAppClick,
      }}
    >
      {children}
    </MyApplicationsContext.Provider>
  );
};

export const useMyApplicationsContext = () => {
  const context = useContext(MyApplicationsContext);
  if (context === undefined) {
    throw new Error('useMyApplicationsContext must be used within a MyApplicationsProvider');
  }
  return context;
};
