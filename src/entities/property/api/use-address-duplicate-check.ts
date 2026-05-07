import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { propertyApi } from './property.api';
import type { AddressDuplicateCheckResponse } from './property-api.types';

interface UseAddressDuplicateCheckParams {
  locationId: string | undefined;
  streetAddress: string | undefined;
  latitude: number | undefined;
  longitude: number | undefined;
  excludePropertyId?: string;
  /** Debounce delay in ms. Defaults to 500. */
  debounceMs?: number;
  /** Skip the check entirely (e.g. in edit mode when address hasn't changed). */
  skip?: boolean;
}

interface UseAddressDuplicateCheckResult {
  data: AddressDuplicateCheckResponse | null;
  isLoading: boolean;
  isDebouncing: boolean;
}

/**
 * Real-time duplicate address checker with 500 ms debounce.
 * Returns NONE severity while debouncing to avoid flickering.
 */
export function useAddressDuplicateCheck({
  locationId,
  streetAddress,
  latitude,
  longitude,
  excludePropertyId,
  debounceMs = 500,
  skip = false,
}: UseAddressDuplicateCheckParams): UseAddressDuplicateCheckResult {
  const [debouncedParams, setDebouncedParams] = useState({
    locationId,
    streetAddress,
    latitude,
    longitude,
  });
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (skip) return;
    setIsDebouncing(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedParams({ locationId, streetAddress, latitude, longitude });
      setIsDebouncing(false);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [locationId, streetAddress, latitude, longitude, debounceMs, skip]);

  const isReady =
    !skip &&
    !isDebouncing &&
    !!debouncedParams.locationId &&
    !!debouncedParams.streetAddress?.trim() &&
    debouncedParams.latitude !== undefined &&
    debouncedParams.longitude !== undefined;

  const { data, isFetching } = useQuery({
    queryKey: [
      'address-duplicate-check',
      debouncedParams.locationId,
      debouncedParams.streetAddress?.trim().toLowerCase(),
      debouncedParams.latitude,
      debouncedParams.longitude,
      excludePropertyId,
    ],
    queryFn: async () => {
      const response = await propertyApi.checkAddressDuplicate({
        location_id: debouncedParams.locationId!,
        street_address: debouncedParams.streetAddress!,
        latitude: debouncedParams.latitude!,
        longitude: debouncedParams.longitude!,
        exclude_property_id: excludePropertyId,
      });
      return response.payload.data;
    },
    enabled: isReady,
    staleTime: 30_000,
    retry: false,
  });

  return {
    data: data ?? null,
    isLoading: isFetching,
    isDebouncing,
  };
}
