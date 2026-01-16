/**
 * Chat feature - Domain types for real-time messaging with Spring Boot WebSocket
 */

export interface ChatMessage {
  id: string;
  senderId: string;
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
