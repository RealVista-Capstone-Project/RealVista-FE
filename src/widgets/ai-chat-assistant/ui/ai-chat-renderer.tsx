'use client';

import { useCallback, useState } from 'react';
import { useAuthSession } from '@/features/auth/model/use-auth-session';
import { AiChatFab } from './ai-chat-fab';
import { AiChatWindow } from './ai-chat-window';
import { useAiChat } from '../model/use-ai-chat';

/**
 * AiChatRenderer - Top-level orchestrator for the AI chat assistant.
 *
 * - Only renders for authenticated users (FAB hidden otherwise).
 * - Delegates all chat state to `useAiChat` (SSE streaming, messages, errors).
 * - Manages local open/close toggle.
 */
export function AiChatRenderer() {
  const { data: session, status } = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isStreaming, error, sendMessage, clearChat } = useAiChat();

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Hide entirely for unauthenticated users or while session is loading
  if (status === 'loading' || !session) return null;

  return (
    <>
      {isOpen && (
        <AiChatWindow
          messages={messages}
          isTyping={isStreaming}
          error={error}
          onSendMessage={sendMessage}
          onClose={handleClose}
          onQuickAction={sendMessage}
          onNewChat={clearChat}
        />
      )}
      <AiChatFab isOpen={isOpen} onClick={handleToggle} />
    </>
  );
}
