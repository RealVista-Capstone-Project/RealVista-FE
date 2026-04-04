'use client';

import { useCallback, useRef, useState } from 'react';
import { sseFetch } from '@/shared/lib/sse';
import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type { AiChatMessage } from '../ui/ai-chat-message-item';

const AI_CHAT_ENDPOINT = '/ai/chat';
const AI_CONVERSATIONS_MESSAGES_ENDPOINT = '/ai/conversations/messages';
const AI_CONVERSATIONS_ENDPOINT = '/ai/conversations';

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
  return {
    id: msg.message_id,
    content: msg.content,
    role: msg.role.toLowerCase() as 'user' | 'assistant',
    timestamp: new Date(msg.created_at),
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

  // AbortController ref — lets us cancel the current stream if the user
  // sends a new message or clears the chat while streaming.
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Load conversation history from the backend.
   * Called when the chat window opens.
   */
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
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
  }, []);

  /**
   * Send a user message and stream the AI response.
   */
  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Abort any in-flight stream
    abortRef.current?.abort();

    const userMsg = createMessage(trimmed, 'user');
    const assistantMsg = createMessage('', 'assistant');

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = assistantMsg.id;

    sseFetch({
      url: AI_CHAT_ENDPOINT,
      body: { message: trimmed },
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
      },
      onError: (message) => {
        setError(message);
        setIsStreaming(false);
        abortRef.current = null;

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
  }, []);

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
    sendMessage,
    clearChat,
    loadHistory,
  };
}
