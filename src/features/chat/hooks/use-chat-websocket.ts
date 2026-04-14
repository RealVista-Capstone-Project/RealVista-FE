'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IMessage } from '@stomp/stompjs';
import { useWebSocket } from '@/shared/lib/websocket';
import { useAuthSession } from '@/features/auth/model/use-auth-session';
import { conversationKeys } from '@/entities/conversation';
import type { ChatWebSocketMessage, WebSocketMessage, SendMessageResponse } from '../model/types';

/**
 * useChatWebSocket Hook
 * Manages WebSocket connection for real-time chat
 *
 * Subscribes to:
 * - /user/queue/messages (Personal message queue)
 * - /user/queue/typing (Personal typing events)
 *
 * Sends to:
 * - /app/chat.send
 * - /app/chat.typing
 */
export function useChatWebSocket() {
  const { data: session } = useAuthSession();
  const queryClient = useQueryClient();

  // Local state for typing indicators (conversationId -> Set of userIds)
  // We expose a helper to check if a specific user is typing in a conversation
  const [typingState, setTypingState] = useState<Record<string, Record<string, string>>>(
    {} // conversationId -> { userId: userName }
  );

  const { isConnected, send, subscribe } = useWebSocket({
    endpoint: process.env.NEXT_PUBLIC_WS_ENDPOINT || 'http://localhost:8080/ws',
    debug: process.env.NODE_ENV === 'development',
    token: session?.user?.accessToken,
    onConnect: () => {
      console.log('[Chat] Connected to WebSocket');
    },
  });

  // Subscribe to personal queues when connected and authenticated
  useEffect(() => {
    if (!isConnected || !session?.user?.id) return;

    // 1. Subscribe to new messages
    const msgSub = subscribe({
      destination: '/user/queue/messages',
      onMessage: (message: IMessage) => {
        try {
          const response: SendMessageResponse = JSON.parse(message.body);

          // Update conversation list (for unread count/last message preview)
          queryClient.invalidateQueries({ queryKey: conversationKeys.list() });

          // Refresh messages for the affected conversation
          if (response.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: conversationKeys.messages(response.conversation_id),
            });
          }
        } catch (error) {
          console.error('[Chat] Failed to parse message:', error);
        }
      },
    });

    // 2. Subscribe to typing indicators
    const typingSub = subscribe({
      destination: '/user/queue/typing',
      onMessage: (message: IMessage) => {
        try {
          const event: WebSocketMessage = JSON.parse(message.body);
          if (event.type === 'TYPING' && event.payload) {
            // payload is conversationId
            const conversationId = String(event.payload);
            const userId = String(event.sender_id || 'unknown');
            const userName = event.sender_name || 'Someone';

            // Update typing state
            setTypingState((prev) => ({
              ...prev,
              [conversationId]: {
                ...(prev[conversationId] || {}),
                [userId]: userName,
              },
            }));

            // Clear typing status after 3 seconds
            setTimeout(() => {
              setTypingState((prev) => {
                const newState = { ...prev };
                if (newState[conversationId]) {
                  const newUsers = { ...newState[conversationId] };
                  delete newUsers[userId];
                  if (Object.keys(newUsers).length === 0) {
                    delete newState[conversationId];
                  } else {
                    newState[conversationId] = newUsers;
                  }
                  return newState;
                }
                return prev;
              });
            }, 3000);
          }
        } catch (error) {
          console.error('[Chat] Failed to parse typing event:', error);
        }
      },
    });

    return () => {
      msgSub();
      typingSub();
    };
  }, [isConnected, session, subscribe, queryClient]);

  // Send a chat message
  const sendMessage = useCallback(
    (message: Omit<ChatWebSocketMessage, 'recipient_user_id'> & { recipientUserId: string }) => {
      if (!session?.user?.id) return;

      const payload: ChatWebSocketMessage = {
        conversation_id: message.conversation_id,
        recipient_user_id: message.recipientUserId,
        message_type: message.message_type,
        content: message.content,
        metadata: message.metadata,
        reply_to_message_id: message.reply_to_message_id,
      };

      send({
        destination: '/app/chat.send',
        body: payload,
      });
    },
    [send, session]
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (conversationId: string, recipientUserId: string) => {
      const payload: ChatWebSocketMessage = {
        conversation_id: conversationId,
        recipient_user_id: recipientUserId,
        message_type: 'SYSTEM', // Using SYSTEM type for typing indicators if needed, or just dummy
        content: 'TYPING',
      };

      send({
        destination: '/app/chat.typing',
        body: payload,
      });
    },
    [send]
  );

  return {
    isConnected,
    sendMessage,
    sendTyping,
    typingState,
  };
}

export default useChatWebSocket;
