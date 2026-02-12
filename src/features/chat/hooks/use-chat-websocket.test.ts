import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatWebSocket } from './use-chat-websocket';
import type { IMessage } from '@stomp/stompjs';
import { useWebSocket } from '@/shared/lib/websocket';

// Mock the useWebSocket hook
jest.mock('@/shared/lib/websocket', () => ({
  useWebSocket: jest.fn(),
}));

// Mock auth session
jest.mock('@/features/auth/model/use-auth-session', () => ({
  useAuthSession: jest.fn(),
}));

import { useAuthSession } from '@/features/auth/model/use-auth-session';

describe('useChatWebSocket Hook', () => {
  let mockSubscribe: jest.Mock;
  let mockSend: jest.Mock;
  let mockDisconnect: jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockOnNewMessage: jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockOnError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockOnNewMessage = jest.fn();
    mockOnError = jest.fn();

    // Create mock subscribe function
    mockSubscribe = jest.fn(() => jest.fn());

    // Create mock send function
    mockSend = jest.fn();

    // Create mock disconnect function
    mockDisconnect = jest.fn();

    // Mock useWebSocket implementation
    (useWebSocket as jest.Mock).mockReturnValue({
      isConnected: false,
      state: 'idle',
      subscribe: mockSubscribe,
      send: mockSend,
      disconnect: mockDisconnect,
      getState: () => 'idle',
    });

    // Mock useAuthSession
    (useAuthSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'test-user-id', accessToken: 'test-token' } },
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with connection state', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: false,
        state: 'disconnected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'disconnected',
      });

      const { result } = renderHook(() => useChatWebSocket());

      expect(result.current.isConnected).toBe(false);
    });

    it('should use token from session', () => {
      renderHook(() => useChatWebSocket());

      expect(useWebSocket).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test-token',
        })
      );
    });
  });

  describe('subscription', () => {
    it('should subscribe to queues when connected', async () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      renderHook(() => useChatWebSocket());

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledWith({
          destination: '/user/queue/messages',
          onMessage: expect.any(Function),
        });
        expect(mockSubscribe).toHaveBeenCalledWith({
          destination: '/user/queue/typing',
          onMessage: expect.any(Function),
        });
      });
    });
  });

  describe('sendMessage', () => {
    it('should send a message to /app/chat.send', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() => useChatWebSocket());

      act(() => {
        result.current.sendMessage({
          conversation_id: 'conv-1',
          recipientUserId: 'user-2',
          message_type: 'TEXT',
          content: 'Hello world',
        });
      });

      expect(mockSend).toHaveBeenCalledWith({
        destination: '/app/chat.send',
        body: {
          conversation_id: 'conv-1',
          recipient_user_id: 'user-2',
          message_type: 'TEXT',
          content: 'Hello world',
        },
      });
    });
  });

  describe('typing', () => {
    it('should send typing indicator', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() => useChatWebSocket());

      act(() => {
        result.current.sendTyping('conv-1', 'user-2');
      });

      expect(mockSend).toHaveBeenCalledWith({
        destination: '/app/chat.typing',
        body: {
          conversation_id: 'conv-1',
          recipient_user_id: 'user-2',
          message_type: 'SYSTEM',
          content: 'TYPING',
        },
      });
    });
  });
});
