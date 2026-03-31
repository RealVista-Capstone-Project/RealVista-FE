import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingApi, listingKeys, revalidateListing } from '@/entities/listing/api';

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      data,
    }: {
      listingId: string;
      data: Record<string, unknown>;
    }) => {
      const response = await listingApi.updateListing(listingId, data);
      return response.payload.data;
    },
    onSuccess: async (_, variables) => {
      // Revalidate Next.js Server Cache for the listing detail
      await revalidateListing(variables.listingId);

      // Await React Query invalidations so the modal only closes
      // after the fresh data has been fully fetched and cached.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: listingKeys.detail(variables.listingId),
        }),
        queryClient.invalidateQueries({
          queryKey: listingKeys.managed(),
        }),
        queryClient.invalidateQueries({
          queryKey: listingKeys.managedSummary(),
        }),
      ]);
    },
  });
}
