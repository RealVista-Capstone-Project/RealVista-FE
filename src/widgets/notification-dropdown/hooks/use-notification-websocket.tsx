'use client';

import { Fragment, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWebSocket } from '@/shared/lib/websocket';
import { mapWsPayloadToNotification, type Notification, type NotificationWsPayload, NotificationEventType } from '@/entities/notification';
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
  /**
   * Optional: navigate when user taps toast action on PRICE_CHANGE.
   * Receives `(listingId, listingSlug?)` so the caller can build a slug-based URL.
   */
  onOpenListing?: (listingId: string, listingSlug?: string) => void;
  /** Localized label for PRICE_CHANGE toast action */
  toastOpenListingLabel?: string;
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
  onOpenListing,
  toastOpenListingLabel,
}: UseNotificationWebSocketOptions) {
  const seenIds = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  // Keep stable refs to callbacks so the subscription closure is never stale
  const onNewNotificationRef = useRef(onNewNotification);
  onNewNotificationRef.current = onNewNotification;
  const onNotificationActionRef = useRef(onNotificationAction);
  onNotificationActionRef.current = onNotificationAction;
  const onOpenListingRef = useRef(onOpenListing);
  onOpenListingRef.current = onOpenListing;

  const { subscribe, isConnected } = useWebSocket({
    endpoint: WS_ENDPOINT,
    token,
  });

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const unsubscribe = subscribe({
      destination: NOTIFICATION_DESTINATION,
      onMessage: (frame) => {
        try {
          const raw = JSON.parse(frame.body) as NotificationWsPayload;

          // Deduplicate — backend may fire over both WS and FCM
          const id = raw.notification_id;
          if (!id || seenIds.current.has(id)) return;
          seenIds.current.add(id);

          const notification = mapWsPayloadToNotification(raw);
          onNewNotificationRef.current(notification);

          const is3dEvent =
            notification.eventType === NotificationEventType.PROPERTY_3D_GENERATED ||
            notification.eventType === NotificationEventType.PROPERTY_3D_FAILED;

          const isPriceChange = notification.eventType === NotificationEventType.PRICE_CHANGE;
          const listingId = notification.entityId?.trim();
          const listingSlug = notification.metadata?.listing_slug?.trim() || undefined;

          if (is3dEvent && onNotificationActionRef.current) {
            toast.info(notification.title, {
              description: notification.message,
              duration: 5000,
              action: {
                label: toastViewLabel,
                onClick: () => onNotificationActionRef.current!(notification),
              },
            });
          } else if (
            isPriceChange &&
            listingId &&
            onOpenListingRef.current &&
            toastOpenListingLabel
          ) {
            // Sonner's `action` sits beside the text; stack message + CTA vertically instead.
            toast.info(notification.title, {
              description: (
                <Fragment>
                  <span className='block text-sm leading-snug opacity-90'>{notification.message}</span>
                  <button
                    type='button'
                    className='mt-2 block w-full text-left text-sm font-semibold text-primary underline-offset-2 hover:underline'
                    onClick={() => onOpenListingRef.current!(listingId, listingSlug)}
                  >
                    {toastOpenListingLabel}
                  </button>
                </Fragment>
              ),
              duration: 5000,
              className: 'items-start',
            });
          } else {
            toast.info(notification.title, {
              description: notification.message,
              duration: 5000,
            });
          }

          if (is3dEvent) {
            queryClient.invalidateQueries({ queryKey: billingKeys.mySubscriptions() });
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[NotificationWS] Failed to parse frame body:', err);
          }
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, isConnected, queryClient, toastViewLabel, toastOpenListingLabel]);
}
