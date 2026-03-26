import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingApi, listingKeys } from '@/entities/listing/api';

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
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific listing details
      queryClient.invalidateQueries({
        queryKey: listingKeys.detail(variables.listingId).queryKey,
      });
      // Invalidate managed listings list and summary
      queryClient.invalidateQueries({
        queryKey: listingKeys.managed().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: listingKeys.managedSummary().queryKey,
      });
    },
  });
}
