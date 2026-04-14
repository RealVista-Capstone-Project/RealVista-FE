'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  notificationApi,
  notificationQueries,
  notificationKeys,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  mapToNotification,
  NotificationEventType,
  type Notification,
  type NotificationResponse,
  type NotificationPageResponse,
} from '@/entities/notification';
import { useNotificationWebSocket } from '../hooks/use-notification-websocket';
import { NotificationDropdown } from './notification-dropdown';

export function NotificationDropdownContainer() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const t = useTranslations('Notifications');

  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string | undefined) ?? 'en';

  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();

  // ── Initial HTTP fetch ───────────────────────────────────────────────────
  // Pass token directly into queryFn to bypass the in-memory sync cache
  // (getAuthTokenSync). The cache is set by AuthTokenProvider.useEffect which
  // runs AFTER the first render, so using the cache directly causes a 401 on
  // the first call even when the session already has a token.
  const { data, isLoading } = useQuery({
    ...notificationQueries.listWithToken(token ?? ''),
    enabled: !!token,
  });

  // listWithToken uses raw fetch() so data is the parsed JSON body directly.
  // Backend returns paginated: { success, data: { content: NotificationResponse[], ... } }
  const rawItems: NotificationResponse[] = useMemo(() => {
    if (!data) return [];
    const arr = (data as NotificationPageResponse).data?.content;
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  // ── Local state (seeded from HTTP, updated via WebSocket) ────────────────
  const [wsNotifications, setWsNotifications] = useState<Notification[]>([]);

  // Merge: HTTP items base + WS prepended items (dedup by id)
  const notifications = useMemo(() => {
    const httpMapped = rawItems.map(mapToNotification);
    const httpIds = new Set(httpMapped.map((n) => n.id));
    const wsOnly = wsNotifications.filter((n) => !httpIds.has(n.id));
    return [...wsOnly, ...httpMapped];
  }, [rawItems, wsNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Helpers ───────────────────────────────────────────────────────────────
  /**
   * Navigate to the 3D management page for a property, optionally jumping
   * straight to a specific room by appending ?roomName=<name>.
   */
  const navigateTo3d = useCallback(
    (entityId: string, metadata: Record<string, string> | null) => {
      const roomName = metadata?.roomName ?? metadata?.room_name;
      const base = `/${locale}/dashboard/property/${entityId}/3d`;
      router.push(roomName ? `${base}?roomName=${encodeURIComponent(roomName)}` : base);
    },
    [locale, router]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleMarkAllRead = () => {
    markAllRead.mutate();
    setWsNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      markRead.mutate(n.id);
      setWsNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
    }

    if (n.eventType === NotificationEventType.PROPERTY_3D_GENERATED || n.eventType === NotificationEventType.PROPERTY_3D_FAILED) {
      if (n.entityId) {
        navigateTo3d(n.entityId, n.metadata);
      }
    } else if (n.eventType.includes('TOUR')) {
      router.push(`/${locale}/appointments`);
    } else if (n.metadata?.listing_id) {
      router.push(`/${locale}/property/${n.metadata.listing_id}`);
    }
  };

  const onNewNotification = useCallback(
    (notification: Notification) => {
      setWsNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
    [queryClient]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await notificationApi.deleteNotification(id, token);
        // Remove from local WS state
        setWsNotifications((prev) => prev.filter((n) => n.id !== id));
        // Invalidate the HTTP cache so the list refetches without the deleted item
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      } catch (err) {
        console.error('[NotificationDropdown] Failed to delete notification:', err);
      }
    },
    [token, queryClient]
  );

  // ── WebSocket real-time channel ──────────────────────────────────────────
  useNotificationWebSocket({
    token,
    toastViewLabel: t('toastView'),
    onNewNotification,
    onNotificationAction: (incoming) => {
      if (
        (incoming.eventType === NotificationEventType.PROPERTY_3D_GENERATED ||
          incoming.eventType === NotificationEventType.PROPERTY_3D_FAILED) &&
        incoming.entityId
      ) {
        navigateTo3d(incoming.entityId, incoming.metadata);
      }
    },
  });

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <button
        type='button'
        className='relative flex size-10 items-center justify-center rounded-lg bg-purple-98 text-main-black'
        disabled
      >
        <span className='h-6 w-6 animate-pulse rounded bg-grey-200' />
      </button>
    );
  }

  return (
    <NotificationDropdown
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAllRead={handleMarkAllRead}
      onNotificationClick={handleNotificationClick}
      onDelete={handleDelete}
      onViewAll={() => router.push(`/${locale}/notifications`)}
    />
  );
}
