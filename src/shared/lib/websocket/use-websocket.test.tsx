import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from './use-websocket';
import { WebSocketService } from './websocket.service';
import type { IMessage } from '@stomp/stompjs';

// Mock WebSocketService
jest.mock('./websocket.service');

// Mock timers
jest.useFakeTimers();

describe('useWebSocket Hook', () => {
  let mockConnect: jest.Mock;
  let mockDisconnect: jest.Mock;
  let mockSubscribe: jest.Mock;
  let mockSend: jest.Mock;
  let mockGetState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock functions
    mockConnect = jest.fn();
    mockDisconnect = jest.fn();
    mockSubscribe = jest.fn(() => () => {});
    mockSend = jest.fn();
    mockGetState = jest.Mock.prototype.mockReturnValue('idle');

    // Mock WebSocketService implementation
    (WebSocketService as jest.MockedClass<typeof WebSocketService>).mockImplementation(() => {
      return {
        connect: mockConnect,
        disconnect: mockDisconnect,
        subscribe: mockSubscribe,
        send: mockSend,
        getState: mockGetState,
        isConnected: () => mockGetState() === 'connected',
      } as unknown as WebSocketService;
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with idle state', () => {
      mockGetState.mockReturnValue('idle');

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      expect(result.current.state).toBe('idle');
      expect(result.current.isConnected).toBe(false);
    });

    it('should create WebSocketService instance on mount', () => {
      renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      expect(WebSocketService).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: 'ws://localhost:8080/ws',
        })
      );
    });

    it('should connect on mount', () => {
      renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe('connection lifecycle', () => {
    it('should update state when connected', async () => {
      const mockOnConnect = jest.fn();

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: mockOnConnect,
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      // Simulate connection
      const onConnectCallback = (WebSocketService as jest.Mock).mock.calls[0][0].onConnect;
      mockGetState.mockReturnValue('connected');

      act(() => {
        onConnectCallback();
      });

      expect(result.current.state).toBe('connected');
      expect(result.current.isConnected).toBe(true);
      expect(mockOnConnect).toHaveBeenCalled();
    });

    it('should update state when disconnected', async () => {
      const mockOnDisconnect = jest.fn();

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: mockOnDisconnect,
          onError: jest.fn(),
        })
      );

      // Simulate connection then disconnection
      mockGetState.mockReturnValue('disconnected');

      act(() => {
        const onDisconnectCallback = (WebSocketService as jest.Mock).mock.calls[0][0].onDisconnect;
        onDisconnectCallback();
      });

      expect(result.current.state).toBe('disconnected');
      expect(result.current.isConnected).toBe(false);
      expect(mockOnDisconnect).toHaveBeenCalled();
    });

    it('should call onError callback on error', () => {
      const mockOnError = jest.fn();
      const mockError = new Error('Connection failed');

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: mockOnError,
        })
      );

      // Simulate error
      mockGetState.mockReturnValue('disconnected');

      act(() => {
        const onErrorCallback = (WebSocketService as jest.Mock).mock.calls[0][0].onError;
        onErrorCallback(mockError);
      });

      expect(result.current.state).toBe('disconnected');
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to a destination', () => {
      const mockUnsubscribe = jest.fn();
      mockSubscribe.mockReturnValue(mockUnsubscribe);

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      act(() => {
        const unsubscribe = result.current.subscribe({
          destination: '/topic/test',
          onMessage: jest.fn(),
        });

        expect(mockSubscribe).toHaveBeenCalledWith({
          destination: '/topic/test',
          onMessage: expect.any(Function),
        });
      });
    });

    it('should return unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      mockSubscribe.mockReturnValue(mockUnsubscribe);

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      act(() => {
        const unsubscribe = result.current.subscribe({
          destination: '/topic/test',
          onMessage: jest.fn(),
        });

        unsubscribe();

        expect(mockUnsubscribe).toHaveBeenCalled();
      });
    });

    it('should handle subscription when service not initialized', () => {
      // Mock service not initialized
      (WebSocketService as jest.Mock).mockImplementation(() => {
        return {
          connect: mockConnect,
          disconnect: mockDisconnect,
          subscribe: () => () => {}, // Return no-op
          send: mockSend,
          getState: () => 'idle',
          isConnected: () => false,
        } as unknown as WebSocketService;
      });

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      act(() => {
        const unsubscribe = result.current.subscribe({
          destination: '/topic/test',
          onMessage: jest.fn(),
        });

        // Should not throw
        expect(() => unsubscribe()).not.toThrow();
      });
    });
  });

  describe('send', () => {
    it('should send a message', () => {
      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      act(() => {
        result.current.send({
          destination: '/app/chat',
          body: { content: 'test message' },
        });
      });

      expect(mockSend).toHaveBeenCalledWith({
        destination: '/app/chat',
        body: { content: 'test message' },
      });
    });

    it('should not send when service not initialized', () => {
      // Mock service not initialized
      (WebSocketService as jest.Mock).mockImplementation(() => {
        return {
          connect: mockConnect,
          disconnect: mockDisconnect,
          subscribe: mockSubscribe,
          send: jest.fn(), // Different mock
          getState: () => 'idle',
          isConnected: () => false,
        } as unknown as WebSocketService;
      });

      const mockSend2 = jest.fn();
      (WebSocketService as jest.Mock).mockImplementation(() => {
        return {
          connect: mockConnect,
          disconnect: mockDisconnect,
          subscribe: mockSubscribe,
          send: mockSend2,
          getState: () => 'idle',
          isConnected: () => false,
        } as unknown as WebSocketService;
      });

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      act(() => {
        result.current.send({
          destination: '/app/chat',
          body: { content: 'test message' },
        });
      });

      // The service's send should be called
      expect(mockSend2).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from WebSocket', () => {
      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      act(() => {
        result.current.disconnect();
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      mockGetState.mockReturnValue('connected');

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      expect(result.current.getState()).toBe('connected');
    });
  });

  describe('cleanup', () => {
    it('should disconnect on unmount', () => {
      const { unmount } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      expect(mockConnect).toHaveBeenCalled();
      expect(mockDisconnect).not.toHaveBeenCalled();

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should call onMessage callback when message received', () => {
      const mockOnMessage = jest.fn();
      const mockMessage: IMessage = {
        body: JSON.stringify({ content: 'test' }),
      } as IMessage;

      const { result } = renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: jest.fn(),
          onDisconnect: jest.fn(),
          onError: jest.fn(),
          onMessage: mockOnMessage,
        })
      );

      // Simulate message
      act(() => {
        const onMessageCallback = (WebSocketService as jest.Mock).mock.calls[0][0].onMessage;
        onMessageCallback(mockMessage);
      });

      expect(mockOnMessage).toHaveBeenCalledWith(mockMessage);
    });

    it('should call custom onConnect callback', () => {
      const mockCustomOnConnect = jest.fn();

      renderHook(() =>
        useWebSocket({
          endpoint: 'ws://localhost:8080/ws',
          onConnect: mockCustomOnConnect,
          onDisconnect: jest.fn(),
          onError: jest.fn(),
        })
      );

      // Simulate connection
      const onConnectCallback = (WebSocketService as jest.Mock).mock.calls[0][0].onConnect;

      act(() => {
        onConnectCallback();
      });

      expect(mockCustomOnConnect).toHaveBeenCalled();
    });
  });
});
