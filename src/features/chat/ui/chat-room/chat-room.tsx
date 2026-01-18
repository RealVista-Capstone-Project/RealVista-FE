'use client';

import { useEffect, useState, useRef } from 'react';
import { env } from '@/shared/lib/env';
import { ChatMessage } from '@/features/chat/model/types';
import { useChatWebSocket } from '@/features/chat/hooks';

interface ChatRoomProps {
  roomId: string;
  userName: string;
  secured?: boolean;
}

/**
 * ChatRoom Component
 * Real-time chat component using WebSocket with Spring Boot backend
 *
 * @example
 * ```tsx
 * // Unsecured endpoint (public)
 * <ChatRoom roomId="room-123" userName="John Doe" secured={false} />
 *
 * // Secured endpoint (requires authentication)
 * <ChatRoom roomId="room-123" userName="John Doe" secured={true} />
 * ```
 */
export function ChatRoom({ roomId, userName, secured = false }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, state, sendMessage, joinRoom, leaveRoom } = useChatWebSocket({
    // Use your Spring Boot WebSocket endpoint
    endpoint: env.NEXT_PUBLIC_WS_ENDPOINT ?? 'http://localhost:8080/ws',
    roomId,
    userName,
    secured, // Pass through the secured prop
    onNewMessage: (message) => {
      setMessages((prev) => [...prev, message]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join room on mount
  useEffect(() => {
    if (isConnected) {
      joinRoom(userName);
    }

    return () => {
      if (isConnected) {
        leaveRoom(userName);
      }
    };
  }, [isConnected, joinRoom, leaveRoom, userName]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    sendMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className='flex h-[600px] flex-col rounded-lg border border-gray-200 bg-white shadow-sm'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-200 px-4 py-3'>
        <div>
          <h2 className='text-lg font-semibold'>Chat Room: {roomId}</h2>
          <p className='text-sm text-gray-500'>Logged in as {userName}</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className='text-sm text-gray-600'>
            {state === 'connected'
              ? 'Connected'
              : state === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4'>
        {messages.length === 0 ? (
          <div className='flex h-full items-center justify-center text-gray-400'>
            No messages yet. Start the conversation!
          </div>
        ) : (
          <ul className='space-y-3'>
            {messages.map((message) => (
              <li
                key={message.id}
                className={`flex ${message.senderName === userName ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.senderName === userName
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.senderName !== userName && (
                    <p className='mb-1 text-xs font-semibold opacity-75'>{message.senderName}</p>
                  )}
                  <p className='text-sm'>{message.content}</p>
                  <p
                    className={`mt-1 text-xs opacity-75 ${
                      message.senderName === userName ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className='border-t border-gray-200 p-4'>
        <div className='flex gap-2'>
          <input
            type='text'
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder='Type a message...'
            disabled={!isConnected}
            className='flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400'
          />
          <button
            type='submit'
            disabled={!isConnected || !inputMessage.trim()}
            className='rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-400'
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatRoom;
