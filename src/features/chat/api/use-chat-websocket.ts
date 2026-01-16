'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Message } from 'stompjs';
import { useWebSocket } from '@/shared/lib/websocket';
import type { ChatMessage } from '../model/types';

/**
 * useChatWebSocket Hook
 * Manages WebSocket connection for real-time chat with Spring Boot backend
 *
 * @example
 * ```tsx
 * function ChatRoom() {
 *   const { isConnected, messages, sendMessage, typingUsers } = useChatWebSocket({
 *     endpoint: 'http://localhost:8080/ws',
 *     roomId: 'room-123',
 *     onNewMessage: (msg) => console.log('New message:', msg),
 *   });
 *
 *   return (
 *     <div>
 *       <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
 *       <ul>
 *         {messages.map((msg) => (
 *           <li key={msg.id}>{msg.senderName}: {msg.content}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useChatWebSocket(options: {
  endpoint: string;
  roomId: string;
  onNewMessage?: (message: ChatMessage) => void;
  onUserJoin?: (userName: string) => void;
  onUserLeave?: (userName: string) => void;
  onTyping?: (userId: string, userName: string, isTyping: boolean) => void;
  onError?: (error: Error) => void;
}) {
  const messagesRef = useRef<ChatMessage[]>([]);
  const typingUsersRef = useRef<Map<string, { userName: string; isTyping: boolean }>>(new Map());

  const {
    isConnected,
    state,
    subscribe,
    send,
    disconnect,
  } = useWebSocket({
    endpoint: options.endpoint,
    onConnect: () => {
      console.log('[Chat WebSocket] Connected to room:', options.roomId);
    },
    onDisconnect: () => {
      console.log('[Chat WebSocket] Disconnected from room:', options.roomId);
    },
    onError: (error) => {
      console.error('[Chat WebSocket] Error:', error);
      options.onError?.(error);
    },
    onMessage: (message: Message) => {
      // Handle messages that don't have a subscription (if any)
      console.log('[Chat WebSocket] Unhandled message:', message);
    },
    debug: process.env.NODE_ENV === 'development',
  });

  // Subscribe to public messages (topic)
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe({
      destination: `/topic/room/${options.roomId}`,
      onMessage: (message: Message) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);

          console.log('[Chat WebSocket] Received message:', chatMessage);

          // Add to messages
          messagesRef.current = [...messagesRef.current, chatMessage];

          // Handle different message types
          if (chatMessage.type === 'JOIN') {
            options.onUserJoin?.(chatMessage.senderName);
          } else if (chatMessage.type === 'LEAVE') {
            options.onUserLeave?.(chatMessage.senderName);
          } else {
            options.onNewMessage?.(chatMessage);
          }
        } catch (error) {
          console.error('[Chat WebSocket] Failed to parse message:', error);
        }
      },
    });

    return unsubscribe;
  }, [isConnected, subscribe, options]);

  // Subscribe to private messages (user-specific queue)
  useEffect(() => {
    if (!isConnected) return;

    // For user-specific messages (e.g., errors, private notifications)
    const unsubscribe = subscribe({
      destination: '/user/queue/messages',
      onMessage: (message: Message) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          console.log('[Chat WebSocket] Private message:', chatMessage);
          options.onNewMessage?.(chatMessage);
        } catch (error) {
          console.error('[Chat WebSocket] Failed to parse private message:', error);
        }
      },
    });

    return unsubscribe;
  }, [isConnected, subscribe, options]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe({
      destination: `/topic/room/${options.roomId}/typing`,
      onMessage: (message: Message) => {
        try {
          const { userId, userName, isTyping } = JSON.parse(message.body);

          if (isTyping) {
            typingUsersRef.current.set(userId, { userName, isTyping });
          } else {
            typingUsersRef.current.delete(userId);
          }

          options.onTyping?.(userId, userName, isTyping);
        } catch (error) {
          console.error('[Chat WebSocket] Failed to parse typing indicator:', error);
        }
      },
    });

    return unsubscribe;
  }, [isConnected, subscribe, options]);

  // Send a chat message
  const sendMessage = useCallback(
    (content: string) => {
      const message = {
        content,
        type: 'CHAT' as const,
        roomId: options.roomId,
      };

      send({
        destination: '/app/chat.sendMessage',
        body: message,
      });
    },
    [send, options.roomId]
  );

  // Join a chat room
  const joinRoom = useCallback(
    (userName: string) => {
      send({
        destination: '/app/chat.addUser',
        body: {
          userName,
          roomId: options.roomId,
          type: 'JOIN',
        },
      });
    },
    [send, options.roomId]
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (userId: string, userName: string, isTyping: boolean) => {
      send({
        destination: '/app/chat.typing',
        body: {
          userId,
          userName,
          isTyping,
          roomId: options.roomId,
        },
      });
    },
    [send, options.roomId]
  );

  // Leave chat room
  const leaveRoom = useCallback(
    (userName: string) => {
      send({
        destination: '/app/chat.leave',
        body: {
          userName,
          roomId: options.roomId,
          type: 'LEAVE',
        },
      });
    },
    [send, options.roomId]
  );

  return {
    // Connection state
    isConnected,
    state,

    // Messages
    messages: messagesRef.current,
    typingUsers: Array.from(typingUsersRef.current.values()),

    // Actions
    sendMessage,
    joinRoom,
    leaveRoom,
    sendTyping,
    disconnect,
  };
}

export default useChatWebSocket;
