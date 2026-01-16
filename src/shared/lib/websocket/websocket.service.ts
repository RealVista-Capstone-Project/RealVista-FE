import SockJS from 'sockjs-client';
import { over, type Frame, type Message, type Client as StompClient } from 'stompjs';
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
  private client: StompClient | null = null;
  private socket: WebSocket | null = null;
  private state: WebSocketState = 'idle';
  private options: Required<Omit<WebSocketOptions, 'headers'>> & {
    headers: WebSocketOptions['headers'];
  };
  private callbacks: WebSocketCallbacks;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
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

    try {
      // Create SockJS connection
      this.socket = new SockJS(this.options.endpoint) as unknown as WebSocket;

      // Create STOMP client over SockJS
      this.client = over(this.socket);

      // Disable debug logs unless debug mode is enabled
      if (!this.options.debug) {
        this.client.debug = () => {};
      }

      // Set connection timeout
      this.connectionTimeoutTimer = setTimeout(() => {
        if (this.state === 'connecting') {
          this.log('Connection timeout');
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, this.options.connectionTimeout);

      // Prepare headers with auth
      const authHeaders = this.getAuthHeaders();
      const headers = { ...authHeaders, ...this.options.headers };

      // Connect to STOMP endpoint
      // stompjs connect method signature: connect(headers, connectCallback, errorCallback)
      this.client.connect(
        headers,
        () => this.onConnected(),
        (error: Frame | string) => this.onError(error)
      );
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting...');

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }

    // Disable auto-reconnect when manually disconnecting
    const originalAutoReconnect = this.options.autoReconnect;
    this.options.autoReconnect = false;

    // Unsubscribe from all subscriptions
    this.unsubscribeAll();

    // Disconnect STOMP client
    if (this.client && this.client.connected) {
      this.client.disconnect(() => {
        this.log('Disconnected');
        this.state = 'disconnected';
        this.callbacks.onDisconnect();
      });
    } else {
      this.state = 'disconnected';
      this.callbacks.onDisconnect();
    }

    // Restore auto-reconnect setting
    this.options.autoReconnect = originalAutoReconnect;

    // Clean up socket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.client = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to a destination
   * @returns unsubscribe function
   */
  subscribe(options: SubscriptionOptions): () => void {
    if (!this.client || !this.client.connected) {
      throw new Error('WebSocket is not connected. Call connect() first.');
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
    const subscription = this.client.subscribe(destination, (message: Message) => {
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
      throw new Error('WebSocket is not connected. Call connect() first.');
    }

    const { destination, body, headers = {} } = message;
    const headersWithAuth = { ...headers, ...this.getAuthHeaders() };

    this.log('Sending message to', destination, body);

    this.client.send(destination, headersWithAuth, JSON.stringify(body));
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
    return this.state === 'connected' && this.client?.connected === true;
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
    this.reconnectAttempts = 0;

    // Resubscribe to all destinations
    this.resubscribeAll();

    this.callbacks.onConnect();
  }

  /**
   * Called when an error occurs
   */
  private onError(error: Frame | string | Error): void {
    this.log('WebSocket error', error);
    this.handleConnectionError(error);
  }

  /**
   * Handle connection error and attempt reconnection
   */
  private handleConnectionError(error: Frame | string | Error): void {
    this.state = 'disconnected';

    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }

    // Convert error to Error type for callback
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.callbacks.onError(errorObj);

    // Attempt reconnection if enabled
    if (this.options.autoReconnect) {
      if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.log(
          `Reconnecting in ${this.options.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`
        );

        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, this.options.reconnectDelay);
      } else {
        this.log('Max reconnection attempts reached');
        this.callbacks.onDisconnect();
      }
    } else {
      this.callbacks.onDisconnect();
    }
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
