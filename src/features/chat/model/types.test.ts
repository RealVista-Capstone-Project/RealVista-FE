import type { WebSocketMessage } from './types';

describe('WebSocketMessage shape', () => {
  it('has sender_id (snake_case)', () => {
    // TypeScript compile-time enforced; runtime check via object shape
    const msg: WebSocketMessage = {
      type: 'TYPING',
      payload: 'conv-1',
      sender_id: 42,
      sender_name: 'Alice',
    };
    expect(msg.sender_id).toBe(42);
    expect(msg.sender_name).toBe('Alice');
  });

  it('does NOT have senderId (camelCase)', () => {
    const msg: WebSocketMessage = {
      type: 'TYPING',
      payload: null,
    };
    // Ensure no legacy camelCase keys exist on the type
    expect('senderId' in msg).toBe(false);
    expect('senderName' in msg).toBe(false);
  });
});
