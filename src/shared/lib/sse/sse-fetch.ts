import { env } from '@/shared/lib/env';
import { getAuthTokenSync } from '@/shared/lib/auth/get-auth-token';

/**
 * Shape of each parsed SSE data chunk from the AI backend.
 *
 * The backend streams `data: {...}` lines with typed events:
 *
 * Start event:  `{"type":"start","conversationId":"uuid","threadId":"uuid"}`
 * Token event:  `{"token":"Hello"}`  (no `type` field)
 * Done event:   `{"type":"done","fullResponse":"Hello world..."}`
 * Error event:  `{"type":"error","message":"Something went wrong"}`
 */
export interface SseDataChunk {
  type?: 'start' | 'done' | 'error';
  /** Start event — conversation ID */
  conversationId?: string;
  /** Start event — thread ID */
  threadId?: string;
  /** Token event — text token to append */
  content?: string;
  /** Done event — full accumulated response */
  fullResponse?: string;
  /** Error event — error message */
  message?: string;
}

export interface SseFetchOptions {
  /** API path (e.g. `/api/v1/ai/chat`). Appended to NEXT_PUBLIC_API_ENDPOINT. */
  url: string;
  /** JSON body to POST. */
  body: Record<string, unknown>;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Called for each parsed SSE data chunk. */
  onData: (chunk: SseDataChunk) => void;
  /** Called when the stream ends normally. */
  onDone: () => void;
  /** Called on any error (HTTP, network, or SSE-level). */
  onError: (message: string) => void;
}

/**
 * SSE-over-POST fetch utility.
 *
 * Uses `fetch()` with `ReadableStream` to consume server-sent events from a
 * POST endpoint that requires JWT authentication. The native `EventSource` API
 * cannot be used because it only supports GET requests.
 *
 * Auth token is obtained synchronously via `getAuthTokenSync()`, matching the
 * pattern used by the project's HTTP client (`src/shared/lib/http/http.ts`).
 */
export async function sseFetch({ url, body, signal, onData, onDone, onError }: SseFetchOptions) {
  const token = getAuthTokenSync();

  const fullUrl = url.startsWith('/')
    ? `${env.NEXT_PUBLIC_API_ENDPOINT}${url}`
    : `${env.NEXT_PUBLIC_API_ENDPOINT}/${url}`;

  let response: Response;

  try {
    response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err: unknown) {
    // Network error or abort
    if (err instanceof DOMException && err.name === 'AbortError') return;
    onError('Network error. Please check your connection.');
    return;
  }

  if (!response.ok) {
    if (response.status === 401) {
      onError('Session expired. Please sign in again.');
    } else if (response.status === 429) {
      onError('Too many requests. Please wait a moment.');
    } else {
      onError(`Server error (${response.status}). Please try again later.`);
    }
    return;
  }

  if (!response.body) {
    onError('Empty response from server.');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onDone();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines from the buffer
      const lines = buffer.split('\n');
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();

        // SSE spec: lines starting with "data: " contain payload
        if (!trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const chunk: SseDataChunk = JSON.parse(jsonStr);

          // Backend error event
          if (chunk.type === 'error') {
            onError(chunk.message ?? 'Unknown error from AI service.');
            reader.cancel();
            return;
          }

          onData(chunk);

          // Backend signals completion
          if (chunk.type === 'done') {
            onDone();
            reader.cancel();
            return;
          }
        } catch {
          // Malformed JSON line — skip silently (could be a keep-alive or comment)
        }
      }
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    onError('Stream interrupted. Please try again.');
  }
}
