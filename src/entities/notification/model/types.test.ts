import {
  mapWsPayloadToNotification,
  type NotificationWsPayload,
} from './types';

describe('mapWsPayloadToNotification', () => {
  const base: NotificationWsPayload = {
    notification_id: 'nid-1',
    title: 'New listing',
    message: 'A property was listed',
    event_type: 'LISTING_CREATED',
    entity_type: 'LISTING',
    entity_id: 'eid-1',
    is_read: false,
    created_at: '2024-01-15T10:00:00Z',
  };

  it('maps all snake_case fields correctly', () => {
    const result = mapWsPayloadToNotification(base);
    expect(result.id).toBe('nid-1');
    expect(result.eventType).toBe('LISTING_CREATED');
    expect(result.entityType).toBe('LISTING');
    expect(result.entityId).toBe('eid-1');
    expect(result.title).toBe('New listing');
    expect(result.message).toBe('A property was listed');
    expect(result.isRead).toBe(false);
    expect(result.createdAt).toEqual(new Date('2024-01-15T10:00:00Z'));
  });

  it('does NOT fall back to any camelCase fields (only snake_case exists)', () => {
    const result = mapWsPayloadToNotification(base);
    // id must come from notification_id only — no camelCase fallback
    expect(result.id).toBe('nid-1');
  });

  it('uses empty string for missing optional fields', () => {
    const minimal: NotificationWsPayload = {
      notification_id: 'nid-2',
      title: 'T',
      message: 'M',
    };
    const result = mapWsPayloadToNotification(minimal);
    expect(result.eventType).toBe('');
    expect(result.entityType).toBe('');
    expect(result.entityId).toBe('');
    expect(result.isRead).toBe(false);
    expect(result.id).toBe('nid-2');
  });

  it('parses JSON metadata string', () => {
    const withMeta: NotificationWsPayload = {
      ...base,
      metadata: '{"listingId":"lid-99"}',
    };
    const result = mapWsPayloadToNotification(withMeta);
    expect(result.metadata).toEqual({ listingId: 'lid-99' });
  });

  it('sets metadata to null on malformed JSON', () => {
    const withBadMeta: NotificationWsPayload = {
      ...base,
      metadata: 'not-json',
    };
    const result = mapWsPayloadToNotification(withBadMeta);
    expect(result.metadata).toBeNull();
  });

  it('NotificationWsPayload type has no camelCase fields', () => {
    const keys = Object.keys(base);
    const camelCaseKeys = ['notificationId', 'eventType', 'entityType', 'entityId', 'isRead', 'createdAt', 'senderName'];
    camelCaseKeys.forEach((k) => {
      expect(keys).not.toContain(k);
    });
  });
});
