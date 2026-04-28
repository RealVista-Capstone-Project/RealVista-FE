'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/features/auth/model/use-auth-session';
import { useTranslations } from 'next-intl';
import { AiChatFab } from './ai-chat-fab';
import { AiChatWindow } from './ai-chat-window';
import { useAiChat } from '../model/use-ai-chat';
import { useAiChatContext } from '../model/use-ai-chat-context';
import type { Listing } from '@/entities/listing';

function formatListingContext(listing: Listing): string {
  const attributes = listing.attributes
    .map((a) => `- ${a.attribute_name}: ${a.display_value}`)
    .join('\n');
  const amenities = listing.amenities.map((a) => `- ${a.amenity_name}`).join('\n');

  return `
[THÔNG TIN BẤT ĐỘNG SẢN ĐANG XEM]
- ID: ${listing.listing_id}
- Tên: ${listing.name}
- Giá: ${listing.price} VND
- Loại hình: ${listing.listing_type} (${listing.property_type.property_type_name})
- Địa chỉ: ${listing.location.district_name}, ${listing.location.city_name}
- Diện tích đất: ${listing.property.land_size_m2} m2
- Diện tích sử dụng: ${listing.property.usable_size_m2} m2
- Kích thước: ${listing.property.width_m}m x ${listing.property.length_m}m
- Mô tả: ${listing.property.description}

[THUỘC TÍNH]
${attributes}

[TIỆN ÍCH]
${amenities}
`.trim();
}

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
      // If we're on a listing detail page, we prefix the user's first message with the listing context.
      // Or we can always include it if the AI is meant to be context-aware on this page.
      if (currentListing) {
        const contextPrefix = formatListingContext(currentListing);
        const fullPrompt = `${contextPrefix}\n\nCâu hỏi: ${text}`;
        sendMessage(fullPrompt);
      } else {
        sendMessage(text);
      }
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
