import type { Frame, IMessage } from '@stomp/stompjs';

// WebSocket connection states
export type WebSocketState =
  | 'idle' // Not connected yet
  | 'connecting' // Attempting to connect
  | 'connected' // Successfully connected
  | 'disconnected'; // Connection lost or closed

// WebSocket configuration options
export interface WebSocketOptions {
  // WebSocket endpoint URL (e.g., 'http://localhost:8080/ws')
  endpoint: string;
  // Connection timeout in milliseconds (default: 5000)
  connectionTimeout?: number;
  // Delay between reconnection attempts in milliseconds (default: 3000)
  reconnectDelay?: number;
  // Additional headers to send during connection
  headers?: { [key: string]: string };
  // Enable debug logging
  debug?: boolean;
}

// STOMP subscription options
export interface SubscriptionOptions {
  // Destination to subscribe to (e.g., '/topic/messages')
  destination: string;
  // Callback when a message is received
  onMessage: (message: IMessage) => void;
  // Optional subscription ID
  id?: string;
}

// STOMP message to send
export interface STOMPMessage {
  // Destination to send message to (e.g., '/app/chat')
  destination: string;
  // Message body (will be JSON.stringified)
  body: unknown;
  // Optional headers
  headers?: { [key: string]: string };
  // Skip authentication for this message (for public endpoints)
  skipAuth?: boolean;
}

// WebSocket event callbacks
export interface WebSocketCallbacks {
  // Called when connection is established
  onConnect: () => void;
  // Called when connection is lost
  onDisconnect: () => void;
  // Called when an error occurs
  onError: (error: Error | Frame) => void;
  // Called when receiving a message (if not using subscriptions)
  onMessage?: (message: IMessage) => void;
}

// Stored subscription info
export interface StoredSubscription {
  destination: string;
  callback: (message: IMessage) => void;
  unsubscribe: () => void;
}
