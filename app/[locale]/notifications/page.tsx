'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi, notificationKeys, mapToNotification } from '@/entities/notification';
import type { NotificationResponse, Notification } from '@/entities/notification';
import { NotificationItem } from '@/widgets/notification-dropdown/ui/notification-item';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: [...notificationKeys.list(), 'full-page', page],
    queryFn: () => notificationApi.listWithToken(token ?? '', { page, size: PAGE_SIZE }),
    enabled: !!token,
    staleTime: 30 * 1000,
  });

  const rawItems: NotificationResponse[] = useMemo(() => {
    if (!data) return [];
    const pageObj = (data as { data?: { content?: NotificationResponse[] } })?.data;
    const arr = pageObj?.content;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const totalPages: number = useMemo(() => {
    const pageObj = (data as { data?: { totalPages?: number } })?.data;
    return pageObj?.totalPages ?? 1;
  }, [data]);

  const notifications: Notification[] = useMemo(
    () => rawItems.map(mapToNotification),
    [rawItems]
  );

  const handleMarkRead = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await notificationApi.markReadWithToken(id, token);
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      } catch {
        // ignore
      }
    },
    [token, queryClient]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await notificationApi.deleteNotification(id, token);
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      } catch {
        // ignore
      }
    },
    [token, queryClient]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await notificationApi.markAllReadWithToken(token);
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    } catch {
      // ignore
    }
  }, [token, queryClient]);

  if (isLoading) {
    return (
      <main className='min-h-screen bg-grey-100 flex items-center justify-center'>
        <p className='text-sm text-grey-400'>Loading notifications…</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className='min-h-screen bg-grey-100 flex items-center justify-center'>
        <p className='text-sm text-red-500'>Failed to load notifications.</p>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-grey-100 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-2xl'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-xl font-semibold text-main-black'>Notifications</h1>
          {notifications.some((n) => !n.isRead) && (
            <button
              type='button'
              onClick={handleMarkAllRead}
              className='text-sm text-main-primary hover:underline'
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className='rounded-xl bg-white border border-border overflow-hidden divide-y divide-border'>
          {notifications.length === 0 ? (
            <p className='px-6 py-10 text-center text-sm text-grey-400'>No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={(notif) => {
                  if (!notif.isRead) handleMarkRead(notif.id);
                }}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-6 flex items-center justify-center gap-3'>
            <button
              type='button'
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className='px-4 py-2 text-sm rounded-lg border border-border bg-white text-main-black disabled:opacity-40 hover:bg-purple-98'
            >
              Previous
            </button>
            <span className='text-sm text-grey-500'>
              Page {page + 1} of {totalPages}
            </span>
            <button
              type='button'
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className='px-4 py-2 text-sm rounded-lg border border-border bg-white text-main-black disabled:opacity-40 hover:bg-purple-98'
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
