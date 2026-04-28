'use client';

import { useCallback, useRef, useState } from 'react';
import { sseFetch } from '@/shared/lib/sse';
import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type { AiChatMessage } from '../ui/ai-chat-message-item';

const AI_CHAT_ENDPOINT = '/ai/chat';
const AI_CONVERSATIONS_MESSAGES_ENDPOINT = '/ai/conversations/messages';
const AI_CONVERSATIONS_ENDPOINT = '/ai/conversations';
const AI_QUOTA_ENDPOINT = '/ai/quota';

/* ---------- Backend response types ---------- */

interface BackendMessage {
  message_id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sequence: number;
  created_at: string;
}

interface ConversationMessagesData {
  conversation_id: string;
  thread_id: string;
  created_at: string;
  messages: BackendMessage[];
}

export interface AiQuotaStatus {
  hasSubscription: boolean;
  remaining: number;
  limit: number;
  isUnlimited: boolean;
}

/* ---------- Helpers ---------- */

/**
 * Create a chat message with a unique ID.
 */
function createMessage(content: string, role: 'user' | 'assistant'): AiChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content,
    role,
    timestamp: new Date(),
  };
}

/**
 * Map a backend message to the frontend AiChatMessage shape.
 */
function mapBackendMessage(msg: BackendMessage): AiChatMessage {
  const parsed = msg.created_at ? new Date(msg.created_at) : null;
  const timestamp = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
  return {
    id: msg.message_id,
    content: msg.content,
    role: msg.role.toLowerCase() as 'user' | 'assistant',
    timestamp,
  };
}

/* ---------- Hook ---------- */

/**
 * useAiChat — manages the AI chat streaming lifecycle.
 *
 * State:
 * - `messages`          — full conversation history (user + assistant)
 * - `isStreaming`       — true while SSE stream is active
 * - `isLoadingHistory`  — true while fetching previous messages from backend
 * - `isClearing`        — true while DELETE /conversations is in-flight
 * - `error`             — latest error message (null when no error)
 *
 * The backend manages thread/conversation continuity — the frontend does not
 * send or store thread IDs.
 */
export function useAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<AiQuotaStatus | null>(null);

  // AbortController ref — lets us cancel the current stream if the user
  // sends a new message or clears the chat while streaming.
  const abortRef = useRef<AbortController | null>(null);

  const loadQuota = useCallback(async () => {
    try {
      const res = await http.get<ApiResponse<AiQuotaStatus>>(AI_QUOTA_ENDPOINT);
      if (res.payload.data) {
        setQuota(res.payload.data);
      }
    } catch {
      // Ignore quota fetch errors
    }
  }, []);

  /**
   * Load conversation history and quota from the backend.
   * Called when the chat window opens.
   */
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    // Load quota in parallel
    loadQuota();
    try {
      const res = await http.get<ApiResponse<ConversationMessagesData>>(
        AI_CONVERSATIONS_MESSAGES_ENDPOINT
      );
      const backendMessages = res.payload.data?.messages;
      if (backendMessages && backendMessages.length > 0) {
        setMessages(backendMessages.map(mapBackendMessage));
      }
    } catch {
      // Silently fail — user just sees the welcome state if no history exists
    } finally {
      setIsLoadingHistory(false);
    }
  }, [loadQuota]);

  /**
   * Send a user message and stream the AI response.
   * @param text The message to display in the UI.
   * @param prompt (Optional) The actual prompt to send to the AI backend. If omitted, `text` is used.
   */
  const sendMessage = useCallback((text: string, prompt?: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isStreaming) return;

    const actualPrompt = (prompt || trimmedText).trim();

    // Abort any in-flight stream
    abortRef.current?.abort();

    const userMsg = createMessage(trimmedText, 'user');
    const assistantMsg = createMessage('', 'assistant');

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = assistantMsg.id;

    sseFetch({
      url: AI_CHAT_ENDPOINT,
      body: { message: actualPrompt },
      signal: controller.signal,
      onData: (chunk) => {
        // Token event — append text to the assistant message
        if (chunk.content) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: msg.content + chunk.content } : msg
            )
          );
        }

        // Start event — no action needed (backend manages thread)
        // Done event is handled by onDone callback (sseFetch calls onDone before returning)
      },
      onDone: () => {
        setIsStreaming(false);
        abortRef.current = null;
        // Refresh quota after a successful message
        loadQuota();
      },
      onError: (message) => {
        // Map specific backend error messages or codes to 'QUOTA_EXCEEDED'
        if (message.includes('hết lượt sử dụng') || message.includes('QUOTA_EXCEEDED')) {
          setError('QUOTA_EXCEEDED');
        } else {
          setError(message);
        }
        setIsStreaming(false);
        abortRef.current = null;

        // Refresh quota even on error (it might have been consumed before the error)
        loadQuota();

        // Remove the empty assistant placeholder if no content was streamed
        setMessages((prev) => {
          const assistant = prev.find((m) => m.id === assistantId);
          if (assistant && !assistant.content) {
            return prev.filter((m) => m.id !== assistantId);
          }
          return prev;
        });
      },
    });
  }, [isStreaming, loadQuota]);

  /**
   * Clear chat — resets local state immediately and calls DELETE on the backend.
   * The DELETE call is fire-and-forget: local state is cleared regardless of outcome.
   */
  const clearChat = useCallback(async () => {
    // Abort any in-flight stream
    abortRef.current?.abort();
    abortRef.current = null;

    // Clear local state immediately for instant UX
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    setIsClearing(true);

    try {
      await http.delete(AI_CONVERSATIONS_ENDPOINT);
    } catch {
      // Silently fail — local state already cleared.
      // Worst case: old history reappears on next reload.
    } finally {
      setIsClearing(false);
    }
  }, []);

  return {
    messages,
    isStreaming,
    isLoadingHistory,
    isClearing,
    error,
    quota,
    sendMessage,
    clearChat,
    loadHistory,
    loadQuota,
  };
}
