'use client';

import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage } from '@/shared/config/firebase';
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
    if (!messaging) {
      setError('Firebase Messaging is not available');
      return;
    }

    const requestPermission = async () => {
      setIsLoading(true);

      try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          // Get FCM token using validated VAPID key from env
          const fcmToken = await getToken(messaging, {
            vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });

          setToken(fcmToken);
          console.log('FCM Token:', fcmToken);

          // Send token to backend using validated API endpoint
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
      } catch (err: any) {
        setError(err.message);
        console.error('FCM Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    requestPermission();

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground notification:', payload);

      if (payload.notification) {
        new Notification(payload.notification.title || 'New Message', {
          body: payload.notification.body,
          icon: '/icon.png',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return { token, error, isLoading };
}
