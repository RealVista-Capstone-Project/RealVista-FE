'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useWebSocket } from '@/shared/lib/websocket';
import { mapWsPayloadToNotification, type Notification, type NotificationWsPayload } from '@/entities/notification';

const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT ?? 'http://localhost:8080/ws';
const NOTIFICATION_DESTINATION = '/user/queue/notifications';

interface UseNotificationWebSocketOptions {
  /** Access token from session — hook will not connect until this is truthy */
  token: string | undefined;
  /** Called with the mapped Notification when a new frame arrives */
  onNewNotification: (notification: Notification) => void;
}

/**
 * Subscribes to /user/queue/notifications over STOMP WebSocket.
 * On each incoming frame:
 *  1. Maps the raw NotificationResponse to a Notification
 *  2. Calls onNewNotification so the container can prepend it to local state
 *  3. Shows a toast (deduplicated by notificationId to prevent double-fire)
 */
export function useNotificationWebSocket({
  token,
  onNewNotification,
}: UseNotificationWebSocketOptions) {
  const seenIds = useRef<Set<string>>(new Set());
  // Keep a stable ref to the callback so the subscription closure is not stale
  const onNewNotificationRef = useRef(onNewNotification);
  onNewNotificationRef.current = onNewNotification;

  const { isConnected, subscribe } = useWebSocket({
    endpoint: WS_ENDPOINT,
    token,
  });

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe({
      destination: NOTIFICATION_DESTINATION,
      onMessage: (frame) => {
        try {
          const raw = JSON.parse(frame.body) as NotificationWsPayload;

          // Deduplicate — backend may fire over both WS and FCM
          const id = raw.notificationId ?? raw.notification_id ?? '';
          if (!id || seenIds.current.has(id)) return;
          seenIds.current.add(id);

          const notification = mapWsPayloadToNotification(raw);
          onNewNotificationRef.current(notification);

          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        } catch {
          // Silently ignore malformed frames
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, subscribe]);
}
