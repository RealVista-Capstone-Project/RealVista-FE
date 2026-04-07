'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertyQueries } from '@/entities/property';
import type { OwnerPropertySummary } from '@/entities/property';
import { MOCK_OWNER_PROPERTIES } from './mock-data';

// ─── Toggle this flag to switch between mock and real API ───────────────────
const USE_MOCK = true;
// ────────────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

interface OwnerPropertiesContextValue {
  properties: OwnerPropertySummary[];
  isLoading: boolean;
  isError: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  selectedProperty: OwnerPropertySummary | null;
  setSelectedProperty: (property: OwnerPropertySummary | null) => void;
  totalPages: number;
  totalElements: number;
  ITEMS_PER_PAGE: number;
  handlePropertyClick: (property: OwnerPropertySummary) => void;
}

const OwnerPropertiesContext = createContext<OwnerPropertiesContextValue | null>(null);

export function OwnerPropertiesProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<OwnerPropertySummary | null>(null);

  const queryParams = useMemo(
    () => ({
      page: currentPage - 1, // API is 0-indexed
      size: ITEMS_PER_PAGE,
      keyword: searchQuery || undefined,
    }),
    [currentPage, searchQuery]
  );

  // ── Real API query (disabled when USE_MOCK = true) ──────────────────────
  const queryResult = useQuery({
    ...propertyQueries.ownerAvailable(queryParams),
    enabled: !USE_MOCK,
  });

  // ── Mock data: filter by keyword + paginate client-side ─────────────────
  const mockData = useMemo(() => {
    if (!USE_MOCK) return null;
    const filtered = searchQuery
      ? MOCK_OWNER_PROPERTIES.filter(
          (p) =>
            p.street_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.property_type_info?.property_type_name
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
      : MOCK_OWNER_PROPERTIES;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return {
      content: filtered.slice(start, start + ITEMS_PER_PAGE),
      total_elements: filtered.length,
      total_pages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
    };
  }, [searchQuery, currentPage]);

  const properties = useMemo(() => {
    if (USE_MOCK) return mockData?.content ?? [];
    return queryResult.data?.payload?.data?.content ?? [];
  }, [mockData, queryResult.data]);

  const totalPages = USE_MOCK
    ? (mockData?.total_pages ?? 0)
    : (queryResult.data?.payload?.data?.total_pages ?? 0);

  const totalElements = USE_MOCK
    ? (mockData?.total_elements ?? 0)
    : (queryResult.data?.payload?.data?.total_elements ?? 0);

  const isLoading = USE_MOCK ? false : queryResult.isLoading;
  const isError = USE_MOCK ? false : queryResult.isError;

  const handlePropertyClick = useCallback(
    (property: OwnerPropertySummary) => {
      setSelectedProperty((prev) =>
        prev?.property_id === property.property_id ? null : property
      );
    },
    []
  );

  const value = useMemo<OwnerPropertiesContextValue>(
    () => ({
      properties,
      isLoading,
      isError,
      searchQuery,
      setSearchQuery: (q: string) => {
        setSearchQuery(q);
        setCurrentPage(1);
      },
      currentPage,
      setCurrentPage,
      selectedProperty,
      setSelectedProperty,
      totalPages,
      totalElements,
      ITEMS_PER_PAGE,
      handlePropertyClick,
    }),
    [
      properties,
      isLoading,
      isError,
      searchQuery,
      currentPage,
      selectedProperty,
      totalPages,
      totalElements,
      handlePropertyClick,
    ]
  );

  return (
    <OwnerPropertiesContext.Provider value={value}>
      {children}
    </OwnerPropertiesContext.Provider>
  );
}

export function useOwnerPropertiesContext() {
  const ctx = useContext(OwnerPropertiesContext);
  if (!ctx) {
    throw new Error('useOwnerPropertiesContext must be used within OwnerPropertiesProvider');
  }
  return ctx;
}
