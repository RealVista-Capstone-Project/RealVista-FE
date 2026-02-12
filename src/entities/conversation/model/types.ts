/**
 * Conversation Entity Types
 * Domain models matching backend DTOs (snake_case)
 */

// ============ Enums ============
export type MessageType = 'TEXT' | 'LISTING_CARD' | 'CONTRACT_CARD' | 'SYSTEM';

// ============ Shared DTOs ============
export interface SenderInfo {
  user_id: string;
  name: string;
  avatar_url?: string;
}

// ============ Request DTOs ============
export interface SendMessageRequest {
  recipient_user_id: string;
  message_type: MessageType;
  content?: string;
  metadata?: string;
  reply_to_message_id?: string;
}

// ============ Response DTOs ============
export interface SendMessageResponse {
  message_id: string;
  conversation_id: string;
  sender: SenderInfo;
  recipient_user_id: string;
  message_type: MessageType;
  content?: string;
  metadata?: string;
  reply_to_message_id?: string;
  created_at: string;
  conversation_created: boolean;
}

export interface ConversationResponse {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar_url?: string;
  created_at: string;
}

export interface MessageResponse {
  message_id: string;
  conversation_id: string;
  reply_to_message_id?: string;
  message_type: MessageType;
  content?: string;
  metadata?: string;
  sender: SenderInfo;
  created_at: string;
}

// ============ Pagination ============
export interface CursorBasedPaginationMetadata {
  limit: number;
  has_more: boolean;
  next_cursor?: string;
  prev_cursor?: string;
}

export interface MessagePaginationResponse {
  messages: MessageResponse[];
  pagination: CursorBasedPaginationMetadata;
}

export interface ConversationListItemResponse {
  conversation_id: string;
  other_user: SenderInfo;
  last_message?: string;
  last_message_type?: string;
  last_message_time?: string;
  unread_count: number;
  created_at: string;
}
