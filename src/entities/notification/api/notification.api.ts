import http from '@/shared/lib/http';
import type { NotificationResponse } from '../model/types';

/**
 * Notification API
 */
export const notificationApi = {
  /** List notifications for the current user */
  list: () => http.get<NotificationResponse[]>('/notifications'),

  /** Mark all notifications as read */
  markAllRead: () => http.post<void>('/notifications/read-all', {}),

  /** Mark a single notification as read */
  markRead: (id: string) => http.post<void>(`/notifications/${id}/read`, {}),
} as const;
