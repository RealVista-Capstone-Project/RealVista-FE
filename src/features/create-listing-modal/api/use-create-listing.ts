'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingApi } from '@/entities/listing/api';
import { listingKeys } from '@/entities/listing/api/keys';
import type { CreateListingPayload } from '../model/types';

/**
 * Mutation hook for creating a new listing.
 * Invalidates managed listings queries on success.
 */
export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateListingPayload) => {
      const { payload: responsePayload } = await listingApi.createListing(
        payload as unknown as Record<string, unknown>
      );
      return responsePayload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: listingKeys.managed(),
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: listingKeys.all,
        refetchType: 'active',
      });
    },
  });
}
