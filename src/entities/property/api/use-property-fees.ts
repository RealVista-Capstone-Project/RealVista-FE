import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import type { CreatePropertyFeeRequest, SyncPropertyFeesRequest } from './property-api.types';

export const propertyFeeKeys = {
  all: (propertyId: string) => ['property-fees', propertyId] as const,
};

export function usePropertyFees(propertyId: string | null | undefined) {
  return useQuery({
    queryKey: propertyFeeKeys.all(propertyId ?? ''),
    queryFn: () => propertyApi.getFees(propertyId!),
    enabled: !!propertyId,
    select: (res) => res.payload.data,
  });
}

export function useSyncPropertyFees(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: SyncPropertyFeesRequest) => propertyApi.syncFees(propertyId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyFeeKeys.all(propertyId) });
    },
  });
}

export function useAddPropertyFee(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreatePropertyFeeRequest) => propertyApi.addFee(propertyId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyFeeKeys.all(propertyId) });
    },
  });
}

export function useDeletePropertyFee(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feeId: string) => propertyApi.deleteFee(propertyId, feeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyFeeKeys.all(propertyId) });
    },
  });
}
