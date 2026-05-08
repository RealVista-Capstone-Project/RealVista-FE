import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listingApi, listingKeys } from '@/entities/listing/api';

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => listingApi.deleteListing(listingId),
    onSuccess: () => {
      // Invalidate managed listings list and summary
      queryClient.invalidateQueries({
        queryKey: listingKeys.managed(),
      });
      queryClient.invalidateQueries({
        queryKey: listingKeys.managedInfiniteLists(),
      });
      queryClient.invalidateQueries({
        queryKey: listingKeys.managedSummary(),
      });
    },
  });
}
