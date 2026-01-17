import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatWebSocket } from './use-chat-websocket';
import type { IMessage } from '@stomp/stompjs';
import type { ChatMessage } from '../model/types';

// Mock the useWebSocket hook
jest.mock('@/shared/lib/websocket', () => ({
  useWebSocket: jest.fn(),
}));

import { useWebSocket } from '@/shared/lib/websocket';

describe('useChatWebSocket Hook', () => {
  let mockSubscribe: jest.Mock;
  let mockSend: jest.Mock;
  let mockDisconnect: jest.Mock;
  let mockOnNewMessage: jest.Mock;
  let mockOnUserJoin: jest.Mock;
  let mockOnUserLeave: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockOnNewMessage = jest.fn();
    mockOnUserJoin = jest.fn();
    mockOnUserLeave = jest.fn();
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

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.state).toBe('disconnected');
      expect(result.current.messages).toEqual([]);
    });

    it('should initialize with userName and userId', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          userId: 123,
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('subscription', () => {
    it('should subscribe to /topic/public when connected', async () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledWith({
          destination: '/topic/public',
          onMessage: expect.any(Function),
        });
      });
    });

    it('should handle incoming CHAT message', async () => {
      const chatMessage: ChatMessage = {
        id: 'msg-1',
        senderId: 123,
        senderName: 'Alice',
        content: 'Hello world',
        timestamp: Date.now(),
        type: 'CHAT',
      };

      let messageCallback: ((msg: IMessage) => void) | null = null;

      mockSubscribe.mockImplementation((options) => {
        messageCallback = options.onMessage;
        return jest.fn();
      });

      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      // Simulate receiving a CHAT message
      act(() => {
        messageCallback!({
          body: JSON.stringify(chatMessage),
        } as IMessage);
      });

      expect(mockOnNewMessage).toHaveBeenCalledWith(chatMessage);
      expect(result.current.messages).toContainEqual(chatMessage);
    });

    it('should handle JOIN message', async () => {
      const joinMessage: ChatMessage = {
        id: 'msg-2',
        senderId: 456,
        senderName: 'Bob',
        content: '',
        timestamp: Date.now(),
        type: 'JOIN',
      };

      let messageCallback: ((msg: IMessage) => void) | null = null;

      mockSubscribe.mockImplementation((options) => {
        messageCallback = options.onMessage;
        return jest.fn();
      });

      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onUserJoin: mockOnUserJoin,
          onError: mockOnError,
        })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      act(() => {
        messageCallback!({
          body: JSON.stringify(joinMessage),
        } as IMessage);
      });

      expect(mockOnUserJoin).toHaveBeenCalledWith('Bob');
    });

    it('should handle LEAVE message', async () => {
      const leaveMessage: ChatMessage = {
        id: 'msg-3',
        senderId: 789,
        senderName: 'Charlie',
        content: '',
        timestamp: Date.now(),
        type: 'LEAVE',
      };

      let messageCallback: ((msg: IMessage) => void) | null = null;

      mockSubscribe.mockImplementation((options) => {
        messageCallback = options.onMessage;
        return jest.fn();
      });

      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onUserLeave: mockOnUserLeave,
          onError: mockOnError,
        })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      act(() => {
        messageCallback!({
          body: JSON.stringify(leaveMessage),
        } as IMessage);
      });

      expect(mockOnUserLeave).toHaveBeenCalledWith('Charlie');
    });

    it('should handle malformed message gracefully', async () => {
      let messageCallback: ((msg: IMessage) => void) | null = null;

      mockSubscribe.mockImplementation((options) => {
        messageCallback = options.onMessage;
        return jest.fn();
      });

      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      act(() => {
        messageCallback!({
          body: 'invalid json{',
        } as IMessage);
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(mockOnNewMessage).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('sendMessage', () => {
    it('should send a CHAT message', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.sendMessage('Hello world');
      });

      expect(mockSend).toHaveBeenCalledWith({
        destination: '/app/public',
        body: {
          type: 'CHAT',
          payload: 'Hello world',
          senderName: 'test-user',
        },
      });
    });

    it('should include senderId when provided', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          userId: 123,
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.sendMessage('Hello world');
      });

      expect(mockSend).toHaveBeenCalledWith({
        destination: '/app/public',
        body: {
          type: 'CHAT',
          payload: 'Hello world',
          senderName: 'test-user',
          senderId: 123,
        },
      });
    });
  });

  describe('joinRoom', () => {
    it('should send a JOIN message', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.joinRoom('test-user');
      });

      expect(mockSend).toHaveBeenCalledWith({
        destination: '/app/public',
        body: {
          type: 'JOIN',
          senderName: 'test-user',
        },
      });
    });

    it('should include senderId when provided', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          userId: 456,
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.joinRoom('test-user');
      });

      expect(mockSend).toHaveBeenCalledWith({
        destination: '/app/public',
        body: {
          type: 'JOIN',
          senderName: 'test-user',
          senderId: 456,
        },
      });
    });
  });

  describe('leaveRoom', () => {
    it('should send a LEAVE message', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.leaveRoom('test-user');
      });

      expect(mockSend).toHaveBeenCalledWith({
        destination: '/app/public',
        body: {
          type: 'LEAVE',
          senderName: 'test-user',
        },
      });
    });

    it('should include senderId when provided', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          userId: 789,
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.leaveRoom('test-user');
      });

      expect(mockSend).toHaveBeenCalledWith({
        destination: '/app/public',
        body: {
          type: 'LEAVE',
          senderName: 'test-user',
          senderId: 789,
        },
      });
    });
  });

  describe('error handling', () => {
    it('should call onError callback when error occurs', () => {
      const mockError = new Error('WebSocket error');

      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: false,
        state: 'disconnected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'disconnected',
        onError: mockOnError,
      });

      renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      // Trigger error from useWebSocket
      const onErrorCallback = (useWebSocket as jest.Mock).mock.calls[0]?.onError;
      if (onErrorCallback) {
        act(() => {
          onErrorCallback(mockError);
        });

        expect(mockOnError).toHaveBeenCalledWith(mockError);
      }
    });
  });

  describe('messages state', () => {
    it('should accumulate messages', async () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          senderId: 1,
          senderName: 'Alice',
          content: 'Hello',
          timestamp: Date.now(),
          type: 'CHAT',
        },
        {
          id: 'msg-2',
          senderId: 2,
          senderName: 'Bob',
          content: 'World',
          timestamp: Date.now(),
          type: 'CHAT',
        },
      ];

      let messageCallback: ((msg: IMessage) => void) | null = null;

      mockSubscribe.mockImplementation((options) => {
        messageCallback = options.onMessage;
        return jest.fn();
      });

      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        subscribe: mockSubscribe,
        send: mockSend,
        disconnect: mockDisconnect,
        getState: () => 'connected',
      });

      const { result } = renderHook(() =>
        useChatWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          roomId: 'test-room',
          userName: 'test-user',
          onNewMessage: mockOnNewMessage,
          onError: mockOnError,
        })
      );

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      messages.forEach((msg) => {
        act(() => {
          messageCallback!({
            body: JSON.stringify(msg),
          } as IMessage);
        });
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0]).toEqual(messages[0]);
      expect(result.current.messages[1]).toEqual(messages[1]);
    });
  });
});
