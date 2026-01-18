/**
 * Chat feature - Domain types for real-time messaging with Spring Boot WebSocket
 */

/**
 * WebSocket message DTO matching the server-side WebSocketMessage class
 * @see WebSocketMessage.java
 */
export interface WebSocketMessage {
  type?: 'CHAT' | 'JOIN' | 'LEAVE';
  payload?: unknown;
  senderId?: number;
  senderName?: string;
  timestamp?: string; // ISO 8601 format from server
  metadata?: unknown;
}

/**
 * Parsed chat message for UI display
 */
export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: number;
  type?: 'CHAT' | 'JOIN' | 'LEAVE';
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: number;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
}
