'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { propertyQueries } from '@/entities/property';
import type { OwnerPropertySummary } from '@/entities/property';
import { useDebounce } from '@/shared/lib/hooks';

const ITEMS_PER_PAGE = 10;

interface OwnerPropertiesContextValue {
  properties: OwnerPropertySummary[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedProperty: OwnerPropertySummary | null;
  setSelectedProperty: (property: OwnerPropertySummary | null) => void;
  totalElements: number;
  handlePropertyClick: (property: OwnerPropertySummary) => void;
}

const OwnerPropertiesContext = createContext<OwnerPropertiesContextValue | null>(null);

export function OwnerPropertiesProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQueryRaw] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [selectedProperty, setSelectedProperty] = useState<OwnerPropertySummary | null>(null);

  const queryResult = useInfiniteQuery(
    propertyQueries.ownerAvailableInfinite({
      size: ITEMS_PER_PAGE,
      keyword: debouncedSearch || undefined,
    })
  );

  // Flatten all pages into a single list
  const properties = useMemo(
    () => queryResult.data?.pages.flatMap((page) => page.payload.data.content) ?? [],
    [queryResult.data]
  );

  const totalElements = useMemo(() => {
    const lastPage = queryResult.data?.pages.at(-1);
    const data = lastPage?.payload?.data;
    return data?.totalElements ?? data?.total_elements ?? 0;
  }, [queryResult.data]);

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryRaw(q);
    setSelectedProperty(null);
  }, []);

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
      isLoading: queryResult.isLoading,
      isError: queryResult.isError,
      isFetchingNextPage: queryResult.isFetchingNextPage,
      hasNextPage: queryResult.hasNextPage,
      fetchNextPage: queryResult.fetchNextPage,
      searchQuery,
      setSearchQuery,
      selectedProperty,
      setSelectedProperty,
      totalElements,
      handlePropertyClick,
    }),
    [
      properties,
      queryResult.isLoading,
      queryResult.isError,
      queryResult.isFetchingNextPage,
      queryResult.hasNextPage,
      queryResult.fetchNextPage,
      searchQuery,
      setSearchQuery,
      selectedProperty,
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
