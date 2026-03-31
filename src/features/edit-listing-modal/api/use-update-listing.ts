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
    onSuccess: (_, variables) => {
      // Revalidate Next.js Server Cache for the listing detail
      revalidateListing(variables.listingId);

      // Invalidate specific listing details for React Query
      queryClient.invalidateQueries({
        queryKey: listingKeys.detail(variables.listingId),
      });
      // Invalidate managed listings list and summary
      queryClient.invalidateQueries({
        queryKey: listingKeys.managed(),
      });
      queryClient.invalidateQueries({
        queryKey: listingKeys.managedSummary(),
      });
    },
  });
}
