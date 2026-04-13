import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingBoostApi } from './listing-boost.api';
import { billingKeys } from '@/entities/billing/api';
import { listingKeys } from './keys';

export const listingBoostKeys = {
  all: ['listing-boosts'] as const,
  byListing: (listingId: string) => [...listingBoostKeys.all, listingId] as const,
};

export const listingBoostQueries = {
  byListing: (listingId: string) =>
    queryOptions({
      queryKey: listingBoostKeys.byListing(listingId),
      queryFn: async () => {
        const res = await listingBoostApi.getBoosts(listingId);
        return res.payload.data;
      },
      staleTime: 2 * 60 * 1000,
      enabled: !!listingId,
    }),
};

export function useApplyBoost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      boostType,
    }: {
      listingId: string;
      boostType: 'FEATURED' | 'HOT_BADGE';
    }) => listingBoostApi.applyBoost(listingId, boostType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: listingBoostKeys.byListing(variables.listingId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.myBoosts() });
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(variables.listingId) });
    },
  });
}

export function useRemoveBoost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      boostType,
    }: {
      listingId: string;
      boostType: 'FEATURED' | 'HOT_BADGE';
    }) => listingBoostApi.removeBoost(listingId, boostType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: listingBoostKeys.byListing(variables.listingId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.myBoosts() });
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(variables.listingId) });
    },
  });
}
