import { queryOptions, useMutation } from '@tanstack/react-query';
import { conversationApi } from './conversation.api';
import { conversationKeys } from './keys';
import type { SendMessageRequest } from '../model/types';

/**
 * Conversation Query Factory
 * TanStack Query v5 queryOptions for type-safe queries
 */
export const conversationQueries = {
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
      staleTime: 30 * 1000, // 30 seconds - messages should be fresher
      enabled: !!conversationId,
    }),
} as const;

/**
 * Mutation hook for sending a message
 * Creates conversation automatically if none exists
 */
export function useSendMessage() {
  return useMutation({
    mutationFn: (request: SendMessageRequest) => conversationApi.sendMessage(request),
  });
}
