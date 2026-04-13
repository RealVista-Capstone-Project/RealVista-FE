import http from '@/shared/lib/http';
import { env } from '@/shared/lib/env';
import type { NotificationResponse } from '../model/types';

/**
 * Notification API
 */
export const notificationApi = {
  /** List notifications for the current user */
  list: () => http.get<NotificationResponse[]>('/notifications'),

  /**
   * List notifications with an explicit token, bypassing the in-memory sync cache.
   * Use this from React Query's queryFn to avoid the AuthTokenProvider race condition
   * where session is available but the cache hasn't been set yet.
   */
  listWithToken: (token: string, params?: { page?: number; size?: number }) => {
    const url = new URL(`${env.NEXT_PUBLIC_API_ENDPOINT}/notifications`);
    if (params?.page !== undefined) url.searchParams.set('page', String(params.page));
    if (params?.size !== undefined) url.searchParams.set('size', String(params.size));
    return fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
  },

  /** Mark all notifications as read */
  markAllRead: () => http.put<void>('/notifications/read-all', {}),

  /** Mark a single notification as read */
  markRead: (id: string) => http.put<void>(`/notifications/${id}/read`, {}),

  /** Mark a single notification as read — explicit token variant */
  markReadWithToken: (id: string, token: string): Promise<void> =>
    fetch(`${env.NEXT_PUBLIC_API_ENDPOINT}/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),

  /** Mark all notifications as read — explicit token variant */
  markAllReadWithToken: (token: string): Promise<void> =>
    fetch(`${env.NEXT_PUBLIC_API_ENDPOINT}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),

  /**
   * Delete a notification by ID.
   * Uses raw fetch with explicit token to avoid the in-memory sync-cache
   * race condition (same pattern as listWithToken).
   */
  deleteNotification: (id: string, token: string): Promise<void> =>
    fetch(`${env.NEXT_PUBLIC_API_ENDPOINT}/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),
} as const;
