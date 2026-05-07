import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listingApi } from '@/entities/listing/api';
import { listingKeys } from '@/entities/listing/api/keys';
import { handleErrorApi } from '@/shared/lib/utils/handle-error';

export type ListingStatusAction = 'publish' | 'unpublish' | 'mark-as-sold' | 'mark-as-rented';

const actionToApiMethod = {
  publish: listingApi.publish,
  unpublish: listingApi.unpublish,
  'mark-as-sold': listingApi.markAsSold,
  'mark-as-rented': listingApi.markAsRented,
};

const actionToKey: Record<ListingStatusAction, { success: string; error: string }> = {
  publish: {
    success: 'ListingStatus.toasts.listingPublishedSuccessfully',
    error: 'ListingStatus.toasts.failedToPublishListing',
  },
  unpublish: {
    success: 'ListingStatus.toasts.listingUnpublished',
    error: 'ListingStatus.toasts.failedToUnpublishListing',
  },
  'mark-as-sold': {
    success: 'ListingStatus.toasts.listingMarkedAsSold',
    error: 'ListingStatus.toasts.failedToMarkAsSold',
  },
  'mark-as-rented': {
    success: 'ListingStatus.toasts.listingMarkedAsRented',
    error: 'ListingStatus.toasts.failedToMarkAsRented',
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
      await queryClient.invalidateQueries({
        queryKey: listingKeys.managedInfiniteLists(),
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
  const keys = actionToKey[action];
  try {
    await mutateAsync({ listingId, action });
    toast.success(t(keys.success as Parameters<typeof t>[0]));
  } catch (error: any) {
    handleErrorApi({ error, t });
  }
}
