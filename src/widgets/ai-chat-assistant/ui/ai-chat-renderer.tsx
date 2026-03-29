'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthSession } from '@/features/auth/model/use-auth-session';
import { AiChatFab } from './ai-chat-fab';
import { AiChatWindow } from './ai-chat-window';
import { useAiChat } from '../model/use-ai-chat';

/**
 * AiChatRenderer - Top-level orchestrator for the AI chat assistant.
 *
 * - Only renders for authenticated users (FAB hidden otherwise).
 * - Delegates all chat state to `useAiChat` (SSE streaming, messages, errors).
 * - Loads conversation history when the chat window first opens.
 * - Manages local open/close toggle.
 */
export function AiChatRenderer() {
  const { data: session, status } = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    isStreaming,
    isLoadingHistory,
    isClearing,
    error,
    sendMessage,
    clearChat,
    loadHistory,
  } = useAiChat();

  // Track whether we've already loaded history to avoid re-fetching on every toggle
  const historyLoadedRef = useRef(false);

  // Load conversation history when the chat window first opens
  useEffect(() => {
    if (isOpen && !historyLoadedRef.current) {
      historyLoadedRef.current = true;
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  // Reset the history-loaded flag when conversation is cleared so next open reloads
  const handleNewChat = useCallback(async () => {
    await clearChat();
    historyLoadedRef.current = false;
  }, [clearChat]);

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
          isLoadingHistory={isLoadingHistory}
          isClearing={isClearing}
          error={error}
          onSendMessage={sendMessage}
          onClose={handleClose}
          onQuickAction={sendMessage}
          onNewChat={handleNewChat}
        />
      )}
      <AiChatFab isOpen={isOpen} onClick={handleToggle} />
    </>
  );
}
