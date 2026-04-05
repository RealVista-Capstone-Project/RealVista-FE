'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  rentalContractApi,
  rentalContractKeys,
  rentalContractQueries,
  type CreateRentalContractPayload,
  type GetRentalContractsParams,
  type UpdateRentalContractStatusPayload,
} from '@/entities/rental-contract';

export function useRentalContractsQuery(
  params: GetRentalContractsParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    ...rentalContractQueries.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateRentalContractStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRentalContractStatusPayload) =>
      rentalContractApi.updateRentalContractStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalContractKeys.all });
    },
  });
}

export function useCreateRentalContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRentalContractPayload) => rentalContractApi.createRentalContract(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalContractKeys.all });
    },
  });
}
