import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from './conversation.api';
import { conversationKeys } from './keys';
import type { SendMessageRequest, SendMessageResponse } from '../model/types';
import type { HttpResponse, ApiResponse } from '@/shared/types/api';
import { unwrapApiResponse } from '@/shared/types/api';

/**
 * Conversation Query Factory
 * TanStack Query v5 queryOptions for type-safe queries
 */
export const conversationQueries = {
  /**
   * List all conversations for the current user
   */
  list: () =>
    queryOptions({
      queryKey: conversationKeys.list(),
      queryFn: () => conversationApi.listConversations(),
      staleTime: 2 * 60 * 1000,
    }),

  /**
   * Get conversation between current user and another user
   */
  detail: (otherUserId: string) =>
    queryOptions({
      queryKey: conversationKeys.detail(otherUserId),
      queryFn: () => conversationApi.getConversation(otherUserId),
      staleTime: 5 * 60 * 1000,
      enabled: !!otherUserId,
    }),

  /**
   * Get messages from a conversation
   */
  messages: (conversationId: string) =>
    queryOptions({
      queryKey: conversationKeys.messages(conversationId),
      queryFn: () => conversationApi.getMessages(conversationId),
      staleTime: 30 * 1000,
      enabled: !!conversationId,
    }),
} as const;

/**
 * Mutation hook for sending a message
 * Creates conversation automatically if none exists
 * Invalidates conversation list on success for real-time dropdown updates
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendMessageRequest) => conversationApi.sendMessage(request),
    onSuccess: (data: HttpResponse<ApiResponse<SendMessageResponse>>) => {
      // Inval conversation list for real-time dropdown updates
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });

      // Invalidate messages for affected conversation
      const response = unwrapApiResponse<SendMessageResponse>(data);
      if (response.conversation_id) {
        queryClient.invalidateQueries({
          queryKey: conversationKeys.messages(response.conversation_id),
        });
      }
    },
  });
}
