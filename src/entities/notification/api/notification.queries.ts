import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from './notification.api';
import { notificationKeys } from './keys';

export const notificationQueries = {
  list: () =>
    queryOptions({
      queryKey: notificationKeys.list(),
      queryFn: () => notificationApi.list(),
      staleTime: 60 * 1000,
    }),

  /**
   * Query options that pass the token directly to the fetch call.
   * Avoids the AuthTokenProvider race condition (sync cache not yet populated).
   * Call with `enabled: !!token` at the consumer.
   */
  listWithToken: (token: string) =>
    queryOptions({
      queryKey: [...notificationKeys.list(), 'auth'] as const,
      queryFn: () => notificationApi.listWithToken(token),
      staleTime: 60 * 1000,
    }),
} as const;

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}
