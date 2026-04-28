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

/** Paginated page object returned inside the API wrapper */
export interface NotificationPage {
  content: NotificationResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

/** Top-level API response for GET /notifications */
export interface NotificationPageResponse {
  success: boolean;
  data: NotificationPage;
}

/**
 * Known notification event type constants.
 * Matches EventType enum in realvista-be.
 */
export const NotificationEventType = {
  NEW_LISTING: 'NEW_LISTING',
  PRICE_CHANGE: 'PRICE_CHANGE',
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  NEW_TOUR_REQUEST: 'NEW_TOUR_REQUEST',
  NEW_MESSAGE: 'NEW_MESSAGE',
  LISTING_EXPIRED: 'LISTING_EXPIRED',
  LISTING_EXPIRING_SOON: 'LISTING_EXPIRING_SOON',
  LISTING_SOLD: 'LISTING_SOLD',
  SYSTEM: 'SYSTEM',
  PROPERTY_3D_GENERATED: 'PROPERTY_3D_GENERATED',
  PROPERTY_3D_FAILED: 'PROPERTY_3D_FAILED',
  LISTING_RENTED: 'LISTING_RENTED',
  LEASE_TERMINATED: 'LEASE_TERMINATED',
  NEW_AGENT_PROPOSAL: 'NEW_AGENT_PROPOSAL',
  AGENT_PROPOSAL_ACCEPTED: 'AGENT_PROPOSAL_ACCEPTED',
  AGENT_PROPOSAL_REJECTED: 'AGENT_PROPOSAL_REJECTED',
  OWNER_ENGAGEMENT_REVIEW_REMINDER: 'OWNER_ENGAGEMENT_REVIEW_REMINDER',
} as const;

export type NotificationEventTypeValue = typeof NotificationEventType[keyof typeof NotificationEventType];

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
