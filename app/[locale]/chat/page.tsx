import { ChatView } from '@/features/chat/ui/chat-view/chat-view';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';

/**
 * Chat Page
 *
 * Real-time chat page using WebSocket with Spring Boot backend.
 *
 * Features:
 * - SockJS + STOMP protocol for WebSocket communication
 * - Real-time messaging across multiple clients
 * - Typing indicators
 * - Auto-reconnect on disconnect
 * - Locale-aware routing (supports /vi and /en)
 */
export default function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return <ChatView />;
}
