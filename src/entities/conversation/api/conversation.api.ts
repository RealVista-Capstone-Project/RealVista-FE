import http from '@/shared/lib/http';
import type {
  ConversationListItemResponse,
  ConversationResponse,
  MessagePaginationResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../model/types';
import type { ApiResponse } from '@/shared/types/api';

/**
 * Conversation API - HTTP methods for conversation management
 */
export const conversationApi = {
  /**
   * List all conversations for the current user
   */
  listConversations: () => http.get<ConversationListItemResponse[]>('/conversations'),

  /**
   * Create or get conversation between current user and another user
   */
  createOrGetConversation: (otherUserId: string) =>
    http.post<ApiResponse<ConversationResponse>>(`/conversations/users/${otherUserId}`, {}),

  /**
   * Get messages from a conversation with cursor-based pagination
   */
  getMessages: (
    conversationId: string,
    params?: { limit?: number; before?: string; after?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.before) searchParams.set('before', params.before);
    if (params?.after) searchParams.set('after', params.after);
    const query = searchParams.toString();
    return http.get<MessagePaginationResponse>(
      `/conversations/${conversationId}/messages${query ? `?${query}` : ''}`
    );
  },

  /**
   * Send a message to a user
   * Creates conversation automatically if none exists
   */
  sendMessage: (request: SendMessageRequest) =>
    http.post<ApiResponse<SendMessageResponse>>('/conversations/messages', request),
} as const;
