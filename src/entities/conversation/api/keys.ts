/**
 * Conversation Query Keys
 * Centralized query keys for TanStack Query
 */
export const conversationKeys = {
  all: ['conversations'] as const,

  detail: (otherUserId: string) => [...conversationKeys.all, 'detail', otherUserId] as const,

  messages: (conversationId: string) =>
    [...conversationKeys.all, 'messages', conversationId] as const,
} as const;
