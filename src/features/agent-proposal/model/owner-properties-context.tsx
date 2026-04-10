'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { propertyQueries } from '@/entities/property';
import type { OwnerPropertySummary } from '@/entities/property';
import { useDebounce } from '@/shared/lib/hooks';

const ITEMS_PER_PAGE = 10;

export type ListingType = 'SELL' | 'RENT' | 'ALL';

export interface PriceFilter {
  minRentPrice?: number;
  maxRentPrice?: number;
  minBuyPrice?: number;
  maxBuyPrice?: number;
}

export interface PropertyTypeOption {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
}

interface OwnerPropertiesContextValue {
  properties: OwnerPropertySummary[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  priceFilter: PriceFilter;
  setPriceFilter: (filter: PriceFilter) => void;
  listingType: ListingType;
  setListingType: (type: ListingType) => void;
  propertyTypeId: string | null;
  setPropertyTypeId: (id: string | null) => void;
  availablePropertyTypes: PropertyTypeOption[];
  isLoadingPropertyTypes: boolean;
  selectedProperty: OwnerPropertySummary | null;
  setSelectedProperty: (property: OwnerPropertySummary | null) => void;
  totalElements: number;
  handlePropertyClick: (property: OwnerPropertySummary) => void;
}

const OwnerPropertiesContext = createContext<OwnerPropertiesContextValue | null>(null);

export function OwnerPropertiesProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQueryRaw] = useState('');
  const [priceFilter, setPriceFilterRaw] = useState<PriceFilter>({});
  const [listingType, setListingTypeRaw] = useState<ListingType>('ALL');
  const [propertyTypeId, setPropertyTypeIdRaw] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedPriceFilter = useDebounce(priceFilter, 500);
  const [selectedProperty, setSelectedProperty] = useState<OwnerPropertySummary | null>(null);

  // Fetch all property types from dedicated endpoint
  const { data: propertyTypesData, isLoading: isLoadingPropertyTypes } = useQuery(
    propertyQueries.propertyTypes()
  );

  const availablePropertyTypes = useMemo<PropertyTypeOption[]>(
    () =>
      (propertyTypesData?.payload?.data ?? []).map((t) => ({
        id: t.property_type_id,
        name: t.property_type_name,
        categoryId: t.property_category_id,
        categoryName: t.property_category_name,
      })),
    [propertyTypesData]
  );

  const queryResult = useInfiniteQuery(
    propertyQueries.ownerAvailableInfinite({
      size: ITEMS_PER_PAGE,
      keyword: debouncedSearch || undefined,
      min_rent_price: debouncedPriceFilter.minRentPrice,
      max_rent_price: debouncedPriceFilter.maxRentPrice,
      min_buy_price: debouncedPriceFilter.minBuyPrice,
      max_buy_price: debouncedPriceFilter.maxBuyPrice,
      listing_type: listingType === 'ALL' ? undefined : listingType,
      property_type_id: propertyTypeId ?? undefined,
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

  const setPriceFilter = useCallback((filter: PriceFilter) => {
    setPriceFilterRaw(filter);
    setSelectedProperty(null);
  }, []);

  const setListingType = useCallback((type: ListingType) => {
    setListingTypeRaw(type);
    setSelectedProperty(null);
  }, []);

  const setPropertyTypeId = useCallback((id: string | null) => {
    setPropertyTypeIdRaw(id);
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
      priceFilter,
      setPriceFilter,
      listingType,
      setListingType,
      propertyTypeId,
      setPropertyTypeId,
      availablePropertyTypes,
      isLoadingPropertyTypes,
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
      priceFilter,
      listingType,
      propertyTypeId,
      availablePropertyTypes,
      isLoadingPropertyTypes,
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
