import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {
  WebSocketCallbacks,
  WebSocketOptions,
  WebSocketState,
  SubscriptionOptions,
  STOMPMessage,
  StoredSubscription,
} from '@/shared/types/websocket';

/**
 * WebSocket Service for Spring Boot with SockJS and STOMP
 *
 * This service manages WebSocket connections using SockJS and STOMP protocol,
 * commonly used with Spring Boot's WebSocket support.
 *
 * @example
 * ```ts
 * const wsService = new WebSocketService({
 *   endpoint: 'http://localhost:8080/ws',
 *   onConnect: () => console.log('Connected'),
 *   onDisconnect: () => console.log('Disconnected'),
 *   onError: (error) => console.error(error),
 * });
 *
 * wsService.connect();
 * wsService.subscribe({
 *   destination: '/topic/messages',
 *   onMessage: (msg) => console.log(msg.body),
 * });
 * ```
 */
export class WebSocketService {
  private client: Client | null = null;
  private state: WebSocketState = 'idle';
  private options: Required<Omit<WebSocketOptions, 'headers'>> & {
    headers: WebSocketOptions['headers'];
  };
  private callbacks: WebSocketCallbacks;
  private subscriptions: Map<string, StoredSubscription> = new Map();
  private connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: WebSocketOptions & WebSocketCallbacks) {
    this.options = {
      endpoint: options.endpoint,
      useSTOMP: options.useSTOMP ?? true,
      connectionTimeout: options.connectionTimeout ?? 5000,
      autoReconnect: options.autoReconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      headers: options.headers ?? {},
      debug: options.debug ?? false,
    };

    this.callbacks = {
      onConnect: options.onConnect,
      onDisconnect: options.onDisconnect,
      onError: options.onError,
      onMessage: options.onMessage,
    };

    this.log('WebSocket service created', this.options);
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.state === 'connected' || this.state === 'connecting') {
      this.log('Already connected or connecting');
      return;
    }

    this.state = 'connecting';
    this.log('Connecting to', this.options.endpoint);

    // Set connection timeout
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.state === 'connecting') {
        this.log('Connection timeout');
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, this.options.connectionTimeout);

    try {
      // Create STOMP client with SockJS
      this.client = new Client({
        // Connect via SockJS for better browser compatibility
        webSocketFactory: () => new SockJS(this.options.endpoint) as any,

        // STOMP connection headers
        connectHeaders: {
          ...this.getAuthHeaders(),
          ...this.options.headers,
        },

        // Automatically reconnect (built-in to @stomp/stompjs)
        reconnectDelay: this.options.reconnectDelay,

        // Enable heartbeat
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        // Debug logging
        debug: this.options.debug ? (str) => this.log(str) : undefined,

        // Connection lifecycle callbacks
        onConnect: () => this.onConnected(),
        onDisconnect: () => this.onDisconnected(),
        onStompError: (frame) => this.onError(frame),
        onWebSocketClose: () => this.onDisconnected(),
        onWebSocketError: (error) => this.onError(error),
      });

      // Activate the client
      this.client.activate();
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting...');

    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }

    // Unsubscribe from all subscriptions
    this.unsubscribeAll();

    // Deactivate STOMP client
    if (this.client && this.client.connected) {
      this.client.deactivate();
    }

    this.client = null;
    this.state = 'disconnected';
    this.callbacks.onDisconnect();

    this.log('Disconnected');
  }

  /**
   * Subscribe to a destination
   * @returns unsubscribe function
   */
  subscribe(options: SubscriptionOptions): () => void {
    if (!this.client || !this.client.connected) {
      // Return a no-op unsubscribe function
      return () => {};
    }

    const { destination, onMessage, id } = options;

    this.log('Subscribing to', destination);

    const subscriptionId = id || destination;

    // Unsubscribe if already subscribed to this destination
    if (this.subscriptions.has(subscriptionId)) {
      this.log('Unsubscribing from existing subscription', subscriptionId);
      this.subscriptions.get(subscriptionId)?.unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }

    // Subscribe to destination
    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      this.log('Message received from', destination, message.body);
      onMessage(message);
      this.callbacks.onMessage?.(message);
    });

    // Store subscription for later cleanup
    const storedSubscription: StoredSubscription = {
      destination,
      callback: onMessage,
      unsubscribe: () => {
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionId);
        this.log('Unsubscribed from', destination);
      },
    };

    this.subscriptions.set(subscriptionId, storedSubscription);

    return storedSubscription.unsubscribe;
  }

  /**
   * Unsubscribe from a specific destination
   */
  unsubscribe(destinationOrId: string): void {
    const subscription = this.subscriptions.get(destinationOrId);
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  /**
   * Unsubscribe from all destinations
   */
  unsubscribeAll(): void {
    this.log('Unsubscribing from all destinations');
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Send a message to a destination
   */
  send(message: STOMPMessage): void {
    if (!this.client || !this.client.connected) {
      return;
    }

    const { destination, body, headers = {}, skipAuth = false } = message;

    // Include auth headers unless skipAuth is true
    const headersWithAuth = skipAuth ? headers : { ...headers, ...this.getAuthHeaders() };

    this.log('Sending message to', destination, body);

    this.client.publish({
      destination,
      body: JSON.stringify(body),
      headers: headersWithAuth,
    });
  }

  /**
   * Get current connection state
   */
  getState(): WebSocketState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    // Only check the actual STOMP client connection status
    // The service state might lag behind the actual connection
    return this.client?.connected === true;
  }

  /**
   * Resubscribe to all previous subscriptions after reconnection
   */
  private resubscribeAll(): void {
    this.log('Resubscribing to all destinations');

    const subscriptions = Array.from(this.subscriptions.values());
    this.subscriptions.clear();

    subscriptions.forEach(({ destination, callback }) => {
      this.subscribe({ destination, onMessage: callback });
    });
  }

  /**
   * Called when STOMP connection is established
   */
  private onConnected(): void {
    this.log('Connected to WebSocket server');

    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }

    this.state = 'connected';

    // Resubscribe to all destinations
    this.resubscribeAll();

    this.callbacks.onConnect();
  }

  /**
   * Called when disconnected
   */
  private onDisconnected(): void {
    this.log('Disconnected from WebSocket server');

    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }

    this.state = 'disconnected';
    this.callbacks.onDisconnect();
  }

  /**
   * Called when an error occurs
   */
  private onError(error: any): void {
    this.log('WebSocket error', error);
    this.handleConnectionError(error);
  }

  /**
   * Handle connection error and attempt reconnection
   */
  private handleConnectionError(error: any): void {
    this.state = 'disconnected';

    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }

    // Convert error to Error type for callback
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.callbacks.onError(errorObj);
  }

  /**
   * Get authentication headers from localStorage
   */
  private getAuthHeaders(): { [key: string]: string } {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sessionToken');
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    }
    return {};
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[WebSocketService]', ...args);
    }
  }
}

export default WebSocketService;
