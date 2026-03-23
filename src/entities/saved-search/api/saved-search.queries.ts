import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedSearchApi } from './saved-search.api';
import { savedSearchKeys } from './keys';
import type { SaveSearchRequest } from './saved-search-api.types';

export const savedSearchQueries = {
  list: () =>
    queryOptions({
      queryKey: savedSearchKeys.lists(),
      queryFn: () => savedSearchApi.getAll(),
      staleTime: 5 * 60 * 1000,
    }),
} as const;

export function useSaveSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveSearchRequest) => savedSearchApi.save(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
    onError: (error: any) => {
      // 409 SAVED_SEARCH_DUPLICATE: swallow silently, sync cache so button flips to "already saved"
      const errorCode = error?.response?.data?.payload?.errorCode
        ?? error?.response?.data?.errorCode;
      if (error?.response?.status === 409 || errorCode === 'SAVED_SEARCH_DUPLICATE') {
        queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
        // Do NOT throw — re-throwing in React Query onError causes unhandled rejections
      }
      // For genuine errors: per-call onError in the component will handle the toast
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => savedSearchApi.delete(id),
    // Optimistic Update
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: savedSearchKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(savedSearchKeys.lists());

      // Optimistically update to the new value
      queryClient.setQueryData(savedSearchKeys.lists(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          payload: {
            ...old.payload,
            data: old.payload.data.filter((item: any) =>
               (item.saved_search_id || item.savedSearchId) !== id
            )
          }
        };
      });

      // Return a context object with the snapshotted value
      return { previousData };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, id, context: any) => {
      queryClient.setQueryData(savedSearchKeys.lists(), context?.previousData);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedSearchKeys.lists() });
    },
  });
}
