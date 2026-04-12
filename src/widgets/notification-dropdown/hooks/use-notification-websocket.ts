'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWebSocket } from '@/shared/lib/websocket';
import { mapWsPayloadToNotification, type Notification, type NotificationWsPayload } from '@/entities/notification';
import { billingKeys } from '@/entities/billing';

const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT ?? 'http://localhost:8080/ws';
const NOTIFICATION_DESTINATION = '/user/queue/notifications';

interface UseNotificationWebSocketOptions {
  /** Access token from session — hook will not connect until this is truthy */
  token: string | undefined;
  /** Called with the mapped Notification when a new frame arrives */
  onNewNotification: (notification: Notification) => void;
  /**
   * Called when the user clicks a toast action button (e.g. "View" on a 3D
   * notification). Receives the full Notification so the caller can navigate.
   */
  onNotificationAction?: (notification: Notification) => void;
  /** Localized label for the toast action button shown on 3D notifications */
  toastViewLabel: string;
}

/**
 * Subscribes to /user/queue/notifications over STOMP WebSocket.
 * On each incoming frame:
 *  1. Maps the raw NotificationResponse to a Notification
 *  2. Calls onNewNotification so the container can prepend it to local state
 *  3. Shows a toast (deduplicated by notificationId to prevent double-fire)
 *     For 3D-related events the toast includes a "View" action button.
 */
export function useNotificationWebSocket({
  token,
  onNewNotification,
  onNotificationAction,
  toastViewLabel,
}: UseNotificationWebSocketOptions) {
  const seenIds = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  // Keep stable refs to callbacks so the subscription closure is never stale
  const onNewNotificationRef = useRef(onNewNotification);
  onNewNotificationRef.current = onNewNotification;
  const onNotificationActionRef = useRef(onNotificationAction);
  onNotificationActionRef.current = onNotificationAction;

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

          const is3dEvent =
            notification.eventType === 'PROPERTY_3D_GENERATED' ||
            notification.eventType === 'PROPERTY_3D_FAILED';

          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
            ...(is3dEvent && onNotificationActionRef.current
              ? {
                  action: {
                    label: toastViewLabel,
                    onClick: () => onNotificationActionRef.current!(notification),
                  },
                }
              : {}),
          });

          if (is3dEvent) {
            queryClient.invalidateQueries({ queryKey: billingKeys.mySubscriptions() });
          }
        } catch {
          // Silently ignore malformed frames
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, subscribe, queryClient]);
}
