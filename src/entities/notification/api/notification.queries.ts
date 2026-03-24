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
