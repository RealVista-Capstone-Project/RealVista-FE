import type { SendMessageResponse } from '@/entities/conversation/model/types';

export type { SendMessageResponse };

/**
 * Outgoing WebSocket message DTO
 * Matches ChatWebSocketMessage.java (snake_case)
 */
export interface ChatWebSocketMessage {
  conversation_id: string;
  recipient_user_id: string;
  message_type: 'TEXT' | 'LISTING_CARD' | 'CONTRACT_CARD' | 'SYSTEM';
  content?: string;
  metadata?: string;
  reply_to_message_id?: string;
}

/**
 * Incoming WebSocket message envelope (e.g. for typing indicators)
 * Matches WebSocketMessage.java (snake_case)
 */
export interface WebSocketMessage {
  type: string;
  payload: any;
  sender_id?: number;
  sender_name?: string;
  timestamp?: string; // ISO 8601
  metadata?: any;
}

/**
 * UI Chat Message model (camelCase)
 * Normalized from SendMessageResponse
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'TEXT' | 'LISTING_CARD' | 'CONTRACT_CARD' | 'SYSTEM';
  timestamp: Date;
  isOwn: boolean;
  metadata?: any;
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
  conversationId: string;
}
