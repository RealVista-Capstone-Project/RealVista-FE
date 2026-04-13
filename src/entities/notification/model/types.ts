/**
 * Notification entity types — matches actual backend NotificationResponse DTO
 * Backend uses snake_case field names.
 */

/** Raw shape received from GET /api/v1/notifications (REST) */
export interface NotificationResponse {
  notification_id: string;
  title: string;
  /** Full descriptive message, e.g. "Bạn đã đặt lịch tham quan ..." */
  message: string;
  /** Event type string, e.g. 'NEW_TOUR_REQUEST' */
  event_type: string;
  /** Domain entity type, e.g. 'APPOINTMENT', 'LISTING' */
  entity_type: string;
  entity_id: string;
  is_read: boolean;
  /** JSON-encoded string — use JSON.parse() to get { listingId, appointmentId, ... } */
  metadata: string;
  /** ISO datetime string */
  created_at: string;
}

/**
 * Raw shape received from the STOMP WebSocket frame.
 * Backend now sends snake_case exclusively.
 */
export interface NotificationWsPayload {
  notification_id: string;
  title: string;
  message: string;
  event_type?: string;
  entity_type?: string;
  entity_id?: string;
  is_read?: boolean;
  metadata?: string;
  created_at?: string;
}

/** UI-facing notification shape (camelCase, metadata pre-parsed) */
export interface Notification {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  /** Pre-parsed metadata — null if parsing fails or metadata is absent */
  metadata: Record<string, string> | null;
}

/** Map a raw REST NotificationResponse (snake_case) to the UI Notification type */
export function mapToNotification(raw: NotificationResponse): Notification {
  let metadata: Record<string, string> | null = null;
  try {
    if (raw.metadata) {
      metadata = JSON.parse(raw.metadata) as Record<string, string>;
    }
  } catch {
    // silently ignore malformed metadata
  }
  return {
    id: raw.notification_id,
    eventType: raw.event_type,
    entityType: raw.entity_type,
    entityId: raw.entity_id,
    title: raw.title,
    message: raw.message,
    createdAt: new Date(raw.created_at),
    isRead: raw.is_read,
    metadata,
  };
}

/** Map a raw WS payload (snake_case) to the UI Notification type */
export function mapWsPayloadToNotification(raw: NotificationWsPayload): Notification {
  let metadata: Record<string, string> | null = null;
  try {
    const m = raw.metadata;
    if (m) metadata = JSON.parse(m) as Record<string, string>;
  } catch {
    // silently ignore
  }
  return {
    id: raw.notification_id,
    eventType: raw.event_type ?? '',
    entityType: raw.entity_type ?? '',
    entityId: raw.entity_id ?? '',
    title: raw.title,
    message: raw.message,
    createdAt: new Date(raw.created_at ?? ''),
    isRead: raw.is_read ?? false,
    metadata,
  };
}
