'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  notificationQueries,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  mapToNotification,
  type Notification,
  type NotificationResponse,
} from '@/entities/notification';
import { useNotificationWebSocket } from '../hooks/use-notification-websocket';
import { NotificationDropdown } from './notification-dropdown';

export function NotificationDropdownContainer() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken as string | undefined;

  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string | undefined) ?? 'en';

  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

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
    // data.data is the paginated page object; content holds the actual array
    const page = (data as { data?: { content?: NotificationResponse[] } })?.data;
    const arr = page?.content;
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

  // ── WebSocket real-time channel ──────────────────────────────────────────
  useNotificationWebSocket({
    token,
    onNewNotification: (incoming) => {
      setWsNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

    if (n.eventType.includes('TOUR')) {
      router.push(`/${locale}/appointments`);
    } else if (n.metadata?.listingId) {
      router.push(`/${locale}/property/${n.metadata.listingId}`);
    }
  };

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
      onViewAll={() => router.push(`/${locale}/notifications`)}
    />
  );
}
