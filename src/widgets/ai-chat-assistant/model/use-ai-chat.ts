'use client';

import { useCallback, useRef, useState } from 'react';
import { sseFetch } from '@/shared/lib/sse';
import type { AiChatMessage } from '../ui/ai-chat-message-item';

const AI_CHAT_ENDPOINT = '/ai/chat';

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
 * useAiChat — manages the AI chat streaming lifecycle.
 *
 * State:
 * - `messages`    — full conversation history (user + assistant)
 * - `isStreaming`  — true while SSE stream is active
 * - `threadId`    — thread ID returned by backend for conversation continuity
 * - `error`       — latest error message (null when no error)
 *
 * Does NOT use React Query — SSE streaming doesn't fit the request/response
 * cache model. Uses plain useState + useCallback + useRef.
 */
export function useAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AbortController ref — lets us cancel the current stream if the user
  // sends a new message or clears the chat while streaming.
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Send a user message and stream the AI response.
   */
  const sendMessage = useCallback(
    (text: string) => {
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
        body: {
          message: trimmed,
          ...(threadId ? { thread_id: threadId } : {}),
        },
        signal: controller.signal,
        onData: (chunk) => {
          // Append content token to the assistant message
          if (chunk.content) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId ? { ...msg, content: msg.content + chunk.content } : msg
              )
            );
          }

          // Store thread ID for conversation continuity
          if (chunk.thread_id) {
            setThreadId(chunk.thread_id);
          }
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
    },
    [threadId]
  );

  /**
   * Clear chat — resets messages, thread, and error state.
   * Also aborts any in-flight stream.
   */
  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setThreadId(null);
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    threadId,
    error,
    sendMessage,
    clearChat,
  };
}
