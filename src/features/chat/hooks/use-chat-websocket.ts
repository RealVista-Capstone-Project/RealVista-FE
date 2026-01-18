'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IMessage } from '@stomp/stompjs';
import { useWebSocket } from '@/shared/lib/websocket';
import type { ChatMessage, WebSocketMessage } from '../model/types';

/**
 * useChatWebSocket Hook
 * Manages WebSocket connection for real-time chat with Spring Boot backend
 *
 * Backend endpoints:
 * - Unsecured: Send to /app/public, Subscribe to /topic/public
 * - Secured: Send to /app/secured, Subscribe to /topic/secured
 *
 * @example
 * ```tsx
 * function ChatRoom() {
 *   const { isConnected, messages, sendMessage } = useChatWebSocket({
 *     endpoint: 'http://localhost:8080/ws',
 *     roomId: 'room-123',
 *     secured: false, // Use true for authenticated endpoints
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
  userName?: string;
  userId?: number;
  secured?: boolean;
  onNewMessage?: (message: ChatMessage) => void;
  onUserJoin?: (userName: string) => void;
  onUserLeave?: (userName: string) => void;
  onTyping?: (userId: string, userName: string, isTyping: boolean) => void;
  onError?: (error: Error) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, { userName: string; isTyping: boolean }>>(new Map());

  // Memoize callbacks to prevent unnecessary re-subscriptions
  const memoizedOptions = useMemo(
    () => ({
      onNewMessage: options.onNewMessage,
      onUserJoin: options.onUserJoin,
      onUserLeave: options.onUserLeave,
      onTyping: options.onTyping,
      onError: options.onError,
    }),
    [options.onNewMessage, options.onUserJoin, options.onUserLeave, options.onTyping, options.onError]
  );

  const { isConnected, state, subscribe, send, disconnect } = useWebSocket({
    endpoint: options.endpoint,
    onConnect: () => {
      // Connection established
    },
    onDisconnect: () => {
      // Connection closed
    },
    onError: (error) => {
      console.error('[Chat WebSocket] Error:', error);
      options.onError?.(error);
    },
    onMessage: (message: IMessage) => {
      // Messages are handled by subscriptions
    },
    debug: process.env.NODE_ENV === 'development',
  });

  // Subscribe to messages (topic) - Server broadcasts to /topic/public or /topic/secured
  useEffect(() => {
    if (!isConnected) return;

    const topic = options.secured ? '/topic/secured' : '/topic/public';

    const unsubscribe = subscribe({
      destination: topic,
      onMessage: (message: IMessage) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);

          // Add to messages
          setMessages((prev) => [...prev, chatMessage]);

          // Handle different message types
          if (chatMessage.type === 'JOIN') {
            memoizedOptions.onUserJoin?.(chatMessage.senderName);
          } else if (chatMessage.type === 'LEAVE') {
            memoizedOptions.onUserLeave?.(chatMessage.senderName);
          } else {
            memoizedOptions.onNewMessage?.(chatMessage);
          }
        } catch (error) {
          console.error('[Chat WebSocket] Failed to parse message:', error);
        }
      },
    });

    return unsubscribe;
  }, [isConnected, subscribe, memoizedOptions, options.secured]);

  // Send a chat message - Client sends to /app/public or /app/secured
  const sendMessage = useCallback(
    (content: string) => {
      const message: WebSocketMessage = {
        type: 'CHAT',
        payload: content,
        senderName: options.userName ?? 'Anonymous',
      };

      // Only include senderId if it's a valid number
      if (options.userId !== undefined) {
        message.senderId = options.userId;
      }

      const destination = options.secured ? '/app/secured' : '/app/public';

      send({
        destination,
        body: message,
        skipAuth: !options.secured, // Skip auth for public endpoints
      });
    },
    [send, options.userName, options.userId, options.secured]
  );

  // Join a chat room
  const joinRoom = useCallback(
    (userName: string) => {
      const message: WebSocketMessage = {
        type: 'JOIN',
        senderName: userName,
      };

      // Only include senderId if it's a valid number
      if (options.userId !== undefined) {
        message.senderId = options.userId;
      }

      const destination = options.secured ? '/app/secured' : '/app/public';

      send({
        destination,
        body: message,
        skipAuth: !options.secured, // Skip auth for public endpoints
      });
    },
    [send, options.userId, options.secured]
  );

  // Leave chat room
  const leaveRoom = useCallback(
    (userName: string) => {
      const message: WebSocketMessage = {
        type: 'LEAVE',
        senderName: userName,
      };

      // Only include senderId if it's a valid number
      if (options.userId !== undefined) {
        message.senderId = options.userId;
      }

      const destination = options.secured ? '/app/secured' : '/app/public';

      send({
        destination,
        body: message,
        skipAuth: !options.secured, // Skip auth for public endpoints
      });
    },
    [send, options.userId, options.secured]
  );

  return {
    // Connection state
    isConnected,
    state,

    // Messages
    messages,
    typingUsers: Array.from(typingUsers.values()),

    // Actions
    sendMessage,
    joinRoom,
    leaveRoom,
    disconnect,
  };
}

export default useChatWebSocket;
