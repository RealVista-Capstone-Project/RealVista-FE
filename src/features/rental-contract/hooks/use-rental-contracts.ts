'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  rentalContractApi,
  rentalContractKeys,
  rentalContractQueries,
  type CreateRentalContractPayload,
  type GetAgentContractsParams,
  type GetRentalContractsParams,
  type GetRenterContractsParams,
  type UpdateRentalContractStatusPayload,
} from '@/entities/rental-contract';

export function useRentalContractsQuery(
  params: GetRentalContractsParams,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery({
    ...rentalContractQueries.list(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
}

export function useRentalContractDetailQuery(
  leaseId: string | null,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: rentalContractKeys.detailById(leaseId ?? ''),
    queryFn: () => rentalContractApi.getRentalContractById(leaseId!),
    enabled: Boolean(leaseId) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
  });
}

export function useRenterContractsQuery(
  params: GetRenterContractsParams,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: [...rentalContractKeys.all, 'renter', params.renterId, params],
    queryFn: () => rentalContractApi.getRenterContracts(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
}

export function useAgentContractsQuery(
  params: GetAgentContractsParams,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: [...rentalContractKeys.all, 'agent', params.agentId, params],
    queryFn: () => rentalContractApi.getAgentContracts(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
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
    mutationFn: (payload: CreateRentalContractPayload) =>
      rentalContractApi.createRentalContract(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalContractKeys.all });
    },
  });
}

export function useSendToLandlordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leaseId, returnUrl }: { leaseId: string; returnUrl?: string }) =>
      rentalContractApi.sendToLandlordForSigning(leaseId, returnUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalContractKeys.all });
    },
  });
}

export function useSendToRenterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leaseId, returnUrl }: { leaseId: string; returnUrl?: string }) =>
      rentalContractApi.sendToRenterForSigning(leaseId, returnUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalContractKeys.all });
    },
  });
}

export function useGetLandlordSigningUrlMutation() {
  return useMutation({
    mutationFn: ({ leaseId, returnUrl }: { leaseId: string; returnUrl?: string }) =>
      rentalContractApi.getLandlordSigningUrl(leaseId, returnUrl),
  });
}

export function useGetRenterSigningUrlMutation() {
  return useMutation({
    mutationFn: ({ leaseId, returnUrl }: { leaseId: string; returnUrl?: string }) =>
      rentalContractApi.getRenterSigningUrl(leaseId, returnUrl),
  });
}

export function useConfirmLandlordSignedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaseId: string) => rentalContractApi.confirmLandlordSigned(leaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalContractKeys.all });
    },
  });
}
