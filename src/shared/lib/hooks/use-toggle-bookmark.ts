import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { bookmarkApi, bookmarkKeys } from '@/entities/bookmark';

interface UseToggleBookmarkOptions {
  onLoginRequired?: () => void;
  onSuccess?: (listingId: string, newState: boolean) => void;
  onError?: (listingId: string, error: Error) => void;
}

export function useToggleBookmark(options?: UseToggleBookmarkOptions) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (listingId: string) => {
      if (!session?.user) {
        throw new Error('NOT_AUTHENTICATED');
      }
      return bookmarkApi.toggleBookmark(listingId);
    },
    onSuccess: (_, listingId) => {
      // Invalidate bookmark queries to refetch the latest state
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
      options?.onSuccess?.(listingId, true);
    },
    onError: (error: Error, listingId) => {
      if (error.message === 'NOT_AUTHENTICATED') {
        options?.onLoginRequired?.();
        return;
      }

      console.error('Failed to toggle bookmark for listing:', listingId, error);
      toast.error('Unable to update your bookmark. Please check your connection and try again.');
      options?.onError?.(listingId, error);
    },
  });

  const toggleBookmark = (listingId: string) => {
    if (!session?.user) {
      options?.onLoginRequired?.();
      return;
    }
    mutation.mutate(listingId);
  };

  return {
    toggleBookmark,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
