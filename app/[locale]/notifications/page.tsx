'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import {
  notificationApi,
  notificationKeys,
  mapToNotification,
  NotificationEventType,
} from '@/entities/notification';
import type { NotificationResponse, NotificationPageResponse, Notification } from '@/entities/notification';
import { NotificationItem } from '@/widgets/notification-dropdown/ui/notification-item';
import { Pagination } from '@/shared/ui/realvista-pagination';
import { useNotificationWebSocket } from '@/widgets/notification-dropdown/hooks/use-notification-websocket';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const t = useTranslations('Notifications');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string | undefined) ?? 'en';

  const [page, setPage] = useState(0);
  const [wsNotifications, setWsNotifications] = useState<Notification[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: [...notificationKeys.list(), 'full-page', page],
    queryFn: () => notificationApi.listWithToken(token ?? '', { page, size: PAGE_SIZE }),
    enabled: !!token,
    staleTime: 30 * 1000,
  });

  const rawItems: NotificationResponse[] = useMemo(() => {
    if (!data) return [];
    const arr = (data as NotificationPageResponse).data?.content;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const totalPages: number = useMemo(() => {
    return (data as NotificationPageResponse | undefined)?.data?.totalPages ?? 1;
  }, [data]);

  const notifications: Notification[] = useMemo(() => {
    const httpMapped = rawItems.map(mapToNotification);
    const httpIds = new Set(httpMapped.map((n) => n.id));
    const wsOnly = wsNotifications.filter((n) => !httpIds.has(n.id));
    return [...wsOnly, ...httpMapped];
  }, [rawItems, wsNotifications]);

  const onNewWsNotification = useCallback(
    (n: Notification) => {
      setWsNotifications((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        return [n, ...prev];
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
    [queryClient]
  );

  useNotificationWebSocket({
    token,
    toastViewLabel: t('toastView'),
    toastOpenListingLabel: t('toastViewListing'),
    onNewNotification: onNewWsNotification,
    onOpenListing: (listingId, listingSlug) =>
      router.push(`/${locale}/listing/${listingSlug ?? listingId}`),
  });

  const handleMarkRead = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await notificationApi.markReadWithToken(id, token);
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      } catch (err) {
        console.error('[NotificationsPage] Failed to mark notification as read:', err);
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
      } catch (err) {
        console.error('[NotificationsPage] Failed to delete notification:', err);
      }
    },
    [token, queryClient]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await notificationApi.markAllReadWithToken(token);
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    } catch (err) {
      console.error('[NotificationsPage] Failed to mark all notifications as read:', err);
    }
  }, [token, queryClient]);

  if (isLoading) {
    return (
      <main className='min-h-screen bg-muted flex items-center justify-center'>
        <p className='text-sm text-muted-foreground/60'>{t('loading')}</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className='min-h-screen bg-muted flex items-center justify-center'>
        <p className='text-sm text-red-500'>{t('error')}</p>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-muted py-8 px-4 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-2xl'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-xl font-semibold text-foreground'>{t('notifications')}</h1>
          {notifications.some((n) => !n.isRead) && (
            <button
              type='button'
              onClick={handleMarkAllRead}
              className='text-sm text-primary hover:underline'
            >
              {t('markAsRead')}
            </button>
          )}
        </div>

        <div className='rounded-xl bg-white border border-border overflow-hidden divide-y divide-border'>
          {notifications.length === 0 ? (
            <p className='px-6 py-10 text-center text-sm text-muted-foreground/60'>{t('noNotificationsPage')}</p>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={(notif) => {
                  if (!notif.isRead) handleMarkRead(notif.id);
                  if (notif.eventType === NotificationEventType.PRICE_CHANGE) {
                    const slug = notif.metadata?.listing_slug;
                    if (slug) {
                      router.push(`/${locale}/listing/${slug}`);
                    } else if (notif.entityId) {
                      router.push(`/${locale}/listing/${notif.entityId}`);
                    }
                  }
                }}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-6'>
            <Pagination
              currentPage={page + 1}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
