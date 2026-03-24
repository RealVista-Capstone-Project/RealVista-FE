/**
 * Notification entity types
 */

export type NotificationType =
  | 'OPEN_DRAFT'
  | 'TENANT_APPLICATION'
  | 'TOUR_REQUEST'
  | 'GENERAL';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  created_at: string;
  read: boolean;
  actor?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  /** Optional URL to navigate on click */
  target_url?: string;
}

/** UI-facing notification shape */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  createdAt: Date;
  isRead: boolean;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  targetUrl?: string;
}
