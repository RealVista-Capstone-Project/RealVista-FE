import { WebSocketService } from './websocket.service';
import type { WebSocketCallbacks } from '@/shared/types/websocket';
import { Client, type IMessage } from '@stomp/stompjs';

// Mock @stomp/stompjs Client
const mockClientInstance = {
  connected: false,
  activate: jest.fn(),
  deactivate: jest.fn(),
  subscribe: jest.fn(),
  publish: jest.fn(),
};

jest.mock('@stomp/stompjs', () => ({
  Client: jest.fn().mockImplementation(() => mockClientInstance),
}));

// Mock SockJS
jest.mock('sockjs-client', () => {
  return jest.fn(() => ({
    readyState: 0, // CONNECTING
  }));
});

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockCallbacks: WebSocketCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mock instance state
    mockClientInstance.connected = false;
    mockClientInstance.activate.mockClear();
    mockClientInstance.deactivate.mockClear();
    mockClientInstance.subscribe.mockClear();
    mockClientInstance.publish.mockClear();

    mockCallbacks = {
      onConnect: jest.fn(),
      onDisconnect: jest.fn(),
      onError: jest.fn(),
      onMessage: jest.fn(),
    };

    service = new WebSocketService({
      endpoint: 'ws://localhost:8080/ws',
      debug: false,
      ...mockCallbacks,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    if (service) {
      service.disconnect();
    }
  });

  describe('construction', () => {
    it('should create service with default options', () => {
      const testService = new WebSocketService({
        endpoint: 'ws://localhost:8080/ws',
        debug: false,
        ...mockCallbacks,
      });

      expect(testService).toBeDefined();
      expect(testService.getState()).toBe('idle');

      testService.disconnect();
    });

    it('should create service with custom options', () => {
      const testService = new WebSocketService({
        endpoint: 'ws://localhost:8080/ws',
        connectionTimeout: 10000,
        autoReconnect: false,
        reconnectDelay: 5000,
        maxReconnectAttempts: 10,
        debug: true,
        ...mockCallbacks,
      });

      expect(testService).toBeDefined();

      testService.disconnect();
    });
  });

  describe('connect', () => {
    it('should connect to WebSocket server', () => {
      service.connect();

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          webSocketFactory: expect.any(Function),
          connectHeaders: expect.any(Object),
          reconnectDelay: 3000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        })
      );

      expect(mockClientInstance.activate).toHaveBeenCalled();
      expect(service.getState()).toBe('connecting');
    });

    it('should not connect if already connecting', () => {
      service.connect();
      const stateBefore = service.getState();
      service.connect();

      expect(stateBefore).toBe('connecting');
      expect(mockClientInstance.activate).toHaveBeenCalledTimes(1);
    });

    it('should not connect if already connected', () => {
      // Mock isConnected to return true
      jest.spyOn(service, 'isConnected').mockReturnValue(true);

      service.connect();

      // Simulate successful connection by calling the onConnect callback from the config
      const calls = (Client as jest.Mock).mock.calls;
      if (calls.length > 0) {
        const config = calls[0][0] as any;
        if (config.onConnect) {
          config.onConnect();
        }
      }

      expect(service.getState()).toBe('connected');

      // Try to connect again
      service.connect();

      // activate should only be called once
      expect(mockClientInstance.activate).toHaveBeenCalledTimes(1);
    });

    it('should include auth headers when sessionToken exists', () => {
      const mockToken = 'test-jwt-token';
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        if (key === 'sessionToken') return mockToken;
        return null;
      });

      service.connect();

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          connectHeaders: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );

      getItemSpy.mockRestore();
    });

    it('should set connection timeout', () => {
      jest.spyOn(service as any, 'handleConnectionError');

      service.connect();

      jest.advanceTimersByTime(5000);

      expect((service as any).handleConnectionError).toHaveBeenCalledWith(
        new Error('Connection timeout')
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect from WebSocket server', () => {
      service.connect();
      service.disconnect();

      expect(mockClientInstance.deactivate).toHaveBeenCalled();
      expect(service.getState()).toBe('disconnected');
    });

    it('should call onDisconnect callback', () => {
      service.connect();
      service.disconnect();

      expect(mockCallbacks.onDisconnect).toHaveBeenCalled();
    });

    it('should clear connection timeout', () => {
      jest.spyOn(service as any, 'handleConnectionError');

      service.connect();
      service.disconnect();

      jest.advanceTimersByTime(5000);

      expect((service as any).handleConnectionError).not.toHaveBeenCalled();
    });

    it('should unsubscribe from all subscriptions', () => {
      service.connect();

      // Mock isConnected to return true
      jest.spyOn(service, 'isConnected').mockReturnValue(true);

      const mockUnsubscribe = jest.fn();
      mockClientInstance.subscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });

      service.subscribe({
        destination: '/topic/test',
        onMessage: jest.fn(),
      });

      service.disconnect();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    beforeEach(() => {
      service.connect();
      jest.spyOn(service, 'isConnected').mockReturnValue(true);
    });

    it('should subscribe to a destination', () => {
      const mockOnMessage = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockClientInstance.subscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });

      const unsubscribe = service.subscribe({
        destination: '/topic/test',
        onMessage: mockOnMessage,
      });

      expect(mockClientInstance.subscribe).toHaveBeenCalledWith(
        '/topic/test',
        expect.any(Function)
      );

      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      mockClientInstance.subscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });

      const unsubscribe = service.subscribe({
        destination: '/topic/test',
        onMessage: jest.fn(),
      });

      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should call onMessage callback when message received', () => {
      const mockOnMessage = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockClientInstance.subscribe.mockImplementation((dest, callback) => {
        // Simulate message received
        const mockMessage: IMessage = {
          body: JSON.stringify({ content: 'test message' }),
        } as IMessage;
        callback(mockMessage);
        return { unsubscribe: mockUnsubscribe };
      });

      service.subscribe({
        destination: '/topic/test',
        onMessage: mockOnMessage,
      });

      expect(mockOnMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          body: JSON.stringify({ content: 'test message' }),
        })
      );
    });

    it('should replace existing subscription with same destination', () => {
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();

      mockClientInstance.subscribe
        .mockReturnValueOnce({ unsubscribe: mockUnsubscribe1 })
        .mockReturnValueOnce({ unsubscribe: mockUnsubscribe2 });

      service.subscribe({
        destination: '/topic/test',
        onMessage: jest.fn(),
      });

      service.subscribe({
        destination: '/topic/test',
        onMessage: jest.fn(),
      });

      expect(mockUnsubscribe1).toHaveBeenCalled();
      expect(mockClientInstance.subscribe).toHaveBeenCalledTimes(2);
    });

    it('should return no-op function if not connected', () => {
      jest.spyOn(service, 'isConnected').mockReturnValue(false);

      const unsubscribe = service.subscribe({
        destination: '/topic/test',
        onMessage: jest.fn(),
      });

      expect(mockClientInstance.subscribe).not.toHaveBeenCalled();

      // Should not throw
      unsubscribe();
    });
  });

  describe('unsubscribe', () => {
    beforeEach(() => {
      service.connect();
      jest.spyOn(service, 'isConnected').mockReturnValue(true);
    });

    it('should unsubscribe from a destination', () => {
      const mockUnsubscribe = jest.fn();
      mockClientInstance.subscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });

      service.subscribe({
        destination: '/topic/test',
        onMessage: jest.fn(),
      });

      service.unsubscribe('/topic/test');

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle unsubscribing from non-existent subscription', () => {
      expect(() => {
        service.unsubscribe('/topic/non-existent');
      }).not.toThrow();
    });
  });

  describe('send', () => {
    beforeEach(() => {
      service.connect();
      jest.spyOn(service, 'isConnected').mockReturnValue(true);
    });

    it('should send a message to a destination', () => {
      service.send({
        destination: '/app/chat',
        body: { content: 'test message' },
      });

      expect(mockClientInstance.publish).toHaveBeenCalledWith({
        destination: '/app/chat',
        body: JSON.stringify({ content: 'test message' }),
      });
    });

    it('should include headers if provided', () => {
      service.send({
        destination: '/app/chat',
        body: { content: 'test message' },
        headers: { custom: 'header' },
      });

      expect(mockClientInstance.publish).toHaveBeenCalledWith({
        destination: '/app/chat',
        body: JSON.stringify({ content: 'test message' }),
        headers: { custom: 'header' },
      });
    });

    it('should not send if not connected', () => {
      jest.spyOn(service, 'isConnected').mockReturnValue(false);

      service.send({
        destination: '/app/chat',
        body: { content: 'test message' },
      });

      expect(mockClientInstance.publish).not.toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return initial state as idle', () => {
      expect(service.getState()).toBe('idle');
    });

    it('should return connecting state when connecting', () => {
      service.connect();
      expect(service.getState()).toBe('connecting');
    });

    it('should return connected state after successful connection', () => {
      service.connect();

      // Simulate connection established
      const config = (Client as jest.Mock).mock.calls[0][0];
      config.onConnect();

      expect(service.getState()).toBe('connected');
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should return true when connected', () => {
      jest.spyOn(service, 'isConnected').mockReturnValue(true);
      expect(service.isConnected()).toBe(true);
    });

    it('should return false when disconnected', () => {
      service.connect();
      jest.spyOn(service, 'isConnected').mockReturnValue(false);
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle connection timeout', () => {
      jest.spyOn(service as any, 'handleConnectionError');

      service.connect();
      expect(service.getState()).toBe('connecting');

      jest.advanceTimersByTime(5000);

      expect((service as any).handleConnectionError).toHaveBeenCalled();
      expect(mockCallbacks.onError).toHaveBeenCalled();
    });

    it('should handle WebSocket errors', () => {
      service.connect();

      const config = (Client as jest.Mock).mock.calls[0][0];
      const mockError = new Error('WebSocket error');

      config.onWebSocketError(mockError);

      expect(service.getState()).toBe('disconnected');
      expect(mockCallbacks.onError).toHaveBeenCalledWith(mockError);
    });

    it('should handle STOMP errors', () => {
      service.connect();

      const config = (Client as jest.Mock).mock.calls[0][0];
      const mockFrame = {
        headers: { command: 'ERROR' },
        body: 'STOMP error',
      };

      config.onStompError(mockFrame);

      expect(mockCallbacks.onError).toHaveBeenCalled();
    });
  });

  describe('reconnection', () => {
    it('should clear timeout on successful connection', () => {
      jest.spyOn(service as any, 'handleConnectionError');

      service.connect();

      const config = (Client as jest.Mock).mock.calls[0][0];
      config.onConnect();

      jest.advanceTimersByTime(5000);

      expect((service as any).handleConnectionError).not.toHaveBeenCalled();
    });

    it('should resubscribe to previous subscriptions after reconnection', () => {
      service.connect();

      const mockOnMessage = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockClientInstance.subscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });

      service.subscribe({
        destination: '/topic/test',
        onMessage: mockOnMessage,
      });

      expect(mockClientInstance.subscribe).toHaveBeenCalledTimes(1);

      // Simulate reconnection
      const config = (Client as jest.Mock).mock.calls[0][0];
      config.onConnect();

      // Should resubscribe
      expect(mockClientInstance.subscribe).toHaveBeenCalledTimes(2);
    });
  });
});
