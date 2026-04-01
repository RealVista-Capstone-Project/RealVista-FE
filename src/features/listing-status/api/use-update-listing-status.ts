'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listingApi } from '@/entities/listing/api';
import { listingKeys } from '@/entities/listing/api/keys';

export type ListingStatusAction = 'publish' | 'unpublish' | 'mark-as-sold' | 'mark-as-rented';

const actionToApiMethod = {
  publish: listingApi.publish,
  unpublish: listingApi.unpublish,
  'mark-as-sold': listingApi.markAsSold,
  'mark-as-rented': listingApi.markAsRented,
};

const actionToMessage: Record<ListingStatusAction, { success: string; error: string }> = {
  publish: {
    success: 'Listing published successfully',
    error: 'Failed to publish listing',
  },
  unpublish: {
    success: 'Listing unpublished',
    error: 'Failed to unpublish listing',
  },
  'mark-as-sold': {
    success: 'Listing marked as sold',
    error: 'Failed to mark as sold',
  },
  'mark-as-rented': {
    success: 'Listing marked as rented',
    error: 'Failed to mark as rented',
  },
};

/**
 * Mutation hook for updating listing status
 * Invalidates listing detail and managed list queries on success
 */
export function useUpdateListingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      action,
    }: {
      listingId: string;
      action: ListingStatusAction;
    }) => {
      const method = actionToApiMethod[action];
      const { payload } = await method(listingId);
      return payload;
    },
    onSuccess: async (_, { listingId }) => {
      // Invalidate and refetch the listing detail immediately
      await queryClient.invalidateQueries({
        queryKey: listingKeys.detail(listingId),
        refetchType: 'active',
      });

      // Invalidate and refetch the managed listings list
      await queryClient.invalidateQueries({
        queryKey: listingKeys.managed(),
        refetchType: 'active',
      });

      // Also invalidate all listings to ensure consistency
      await queryClient.invalidateQueries({
        queryKey: listingKeys.all,
        refetchType: 'active',
      });
    },
  });
}

/**
 * Execute a status update with toast notifications
 */
export async function executeStatusUpdate(
  mutateAsync: (variables: { listingId: string; action: ListingStatusAction }) => Promise<unknown>,
  listingId: string,
  action: ListingStatusAction,
  t: (key: string) => string
) {
  const messages = actionToMessage[action];
  try {
    await mutateAsync({ listingId, action });
    toast.success(messages.success);
  } catch (error: any) {
    // 1. Extract error details safely
    const payload = error?.payload || error?.response?.data || error;
    const errorCode = payload?.error_code || payload?.errorCode;
    const backendMessage = payload?.message;

    // 2. Handle specific business logic errors (localized)
    if (errorCode === 'DUPLICATE_LISTING_PUBLISH') {
      toast.error(t('errors.duplicatePublish'));
      return;
    }

    if (errorCode === 'PROPERTY_NOT_AVAILABLE') {
      toast.error(t('errors.propertyNotAvailable'));
      return;
    }

    // 3. Log UNEXPECTED errors for debugging
    console.error('Unhandled Listing Status Update Error:', error);

    // 4. Final decision on what message to show
    // We prioritize: Backend custom message > Generic action error message
    const displayMessage =
      backendMessage && backendMessage !== 'Http Error' ? backendMessage : messages.error;

    toast.error(displayMessage);
  }
}
