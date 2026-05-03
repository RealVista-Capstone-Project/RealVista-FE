'use client';

import { useEffect, useState } from 'react';
import {
  getToken,
  onMessage,
  type MessagePayload,
} from 'firebase/messaging';
import { getFirebaseMessaging } from '@/shared/config/firebase';
import { env } from '@/shared/lib/env/env';

interface UseFCMTokenReturn {
  token: string | null;
  error: string | null;
  isLoading: boolean;
}

export function useFCMToken(): UseFCMTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeMessaging: (() => void) | undefined;

    void (async () => {
      const messagingInstance = await getFirebaseMessaging();
      if (cancelled) return;

      if (!messagingInstance) {
        setError('Firebase Messaging is not available');
        return;
      }

      unsubscribeMessaging = onMessage(
        messagingInstance,
        (payload: MessagePayload) => {
          if (cancelled) return;

          console.log('Foreground notification:', payload);

          if (payload.notification) {
            new Notification(payload.notification.title || 'New Message', {
              body: payload.notification.body,
              icon: '/icon.png',
            });
          }
        }
      );

      setIsLoading(true);

      try {
        const permission = await Notification.requestPermission();
        if (cancelled) return;

        if (permission === 'granted') {
          const fcmToken = await getToken(messagingInstance, {
            vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });

          if (cancelled) return;

          setToken(fcmToken);
          console.log('FCM Token:', fcmToken);

          await fetch('http://localhost:8080/api/test/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: fcmToken,
              title: 'Test from Web',
              body: 'This is a test notification',
            }),
          });

          console.log('Token sent to backend successfully');
        } else {
          setError('Notification permission denied');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to initialize FCM';
          setError(message);
          console.error('FCM Error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeMessaging?.();
    };
  }, []);

  return { token, error, isLoading };
}
