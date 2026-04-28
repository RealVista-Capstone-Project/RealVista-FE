'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/features/auth/model/use-auth-session';
import { useTranslations } from 'next-intl';
import { AiChatFab } from './ai-chat-fab';
import { AiChatWindow } from './ai-chat-window';
import { useAiChat } from '../model/use-ai-chat';
import { useAiChatContext } from '../model/use-ai-chat-context';

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
    quota,
    sendMessage,
    clearChat,
    loadHistory,
  } = useAiChat();
  const { currentListing } = useAiChatContext();
  const t = useTranslations('AiAssistant');

  const analysisActions = useMemo(() => {
    if (!currentListing) return undefined;
    return [
      { key: 'chipAnalyzeListing', text: t('chipAnalyzeListing') },
      { key: 'chipListingProsCons', text: t('chipListingProsCons') },
      { key: 'chipListingPriceForecast', text: t('chipListingPriceForecast') },
      { key: 'chipCompareListing', text: t('chipCompareListing') },
    ];
  }, [currentListing, t]);

  const handleSendMessageWithContext = useCallback(
    (text: string) => {
      sendMessage(text, currentListing?.listing_id);
    },
    [currentListing, sendMessage]
  );

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
          quota={quota}
          onSendMessage={handleSendMessageWithContext}
          onClose={handleClose}
          onQuickAction={handleSendMessageWithContext}
          onNewChat={handleNewChat}
          quickActions={analysisActions}
        />
      )}
      <AiChatFab isOpen={isOpen} onClick={handleToggle} />
    </>
  );
}
