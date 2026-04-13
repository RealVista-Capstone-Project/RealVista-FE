import { WebSocketService } from './websocket.service';
import type { WebSocketCallbacks } from '@/shared/types/websocket';
import { Client } from '@stomp/stompjs';

// Mock @stomp/stompjs Client
const mockClientInstance = {
  connected: false,
  activate: jest.fn(),
  deactivate: jest.fn(),
  subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
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
  });

  describe('disconnect', () => {
    it('should disconnect from WebSocket server', () => {
      service.connect();

      service.disconnect();

      expect(mockCallbacks.onDisconnect).toHaveBeenCalled();
      expect(service.getState()).toBe('disconnected');
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
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('send', () => {
    it('should not send if not connected', () => {
      mockClientInstance.connected = false;

      service.send({
        destination: '/app/chat',
        body: { content: 'test message' },
      });

      expect(mockClientInstance.publish).not.toHaveBeenCalled();
    });
  });

  describe('pending subscriptions', () => {
    it('should queue a subscription when called before connected', () => {
      // service is not yet connected (mockClientInstance.connected = false)
      const onMessage = jest.fn();
      const unsub = service.subscribe({
        destination: '/topic/test',
        onMessage,
      });

      // Should NOT have called client.subscribe yet
      expect(mockClientInstance.subscribe).not.toHaveBeenCalled();

      // The returned unsub should be a function (cancel from pending queue)
      expect(typeof unsub).toBe('function');
    });

    it('should flush pending subscriptions when onConnected fires', () => {
      const onMessage = jest.fn();
      service.subscribe({ destination: '/topic/test', onMessage });

      // Simulate connection establishing
      mockClientInstance.connected = true;
      service.connect();
      const clientConfig = (Client as jest.Mock).mock.calls[0]?.[0];
      clientConfig?.onConnect?.();

      expect(mockClientInstance.subscribe).toHaveBeenCalledWith(
        '/topic/test',
        expect.any(Function)
      );
      expect(mockClientInstance.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should cancel a pending subscription before it is flushed', () => {
      const onMessage = jest.fn();
      service.connect();
      // client is still not connected
      const unsub = service.subscribe({ destination: '/topic/test', onMessage });

      // Cancel before connect fires
      unsub();

      // Now simulate connect
      mockClientInstance.connected = true;
      const clientConfig = (Client as jest.Mock).mock.calls[0]?.[0];
      clientConfig?.onConnect?.();

      // Subscription was cancelled — should NOT call client.subscribe
      expect(mockClientInstance.subscribe).not.toHaveBeenCalled();
    });

    it('should clear pending subscriptions on disconnect', () => {
      const onMessage = jest.fn();
      service.connect();
      service.subscribe({ destination: '/topic/test', onMessage });

      service.disconnect();

      // Reconnect and fire onConnect — pending should be empty
      mockClientInstance.activate.mockClear();
      mockClientInstance.subscribe.mockClear();
      service.connect();
      mockClientInstance.connected = true;
      const clientConfig = (Client as jest.Mock).mock.calls[
        (Client as jest.Mock).mock.calls.length - 1
      ]?.[0];
      clientConfig?.onConnect?.();

      // No pending subscriptions to flush
      expect(mockClientInstance.subscribe).not.toHaveBeenCalled();
    });
  });
});
