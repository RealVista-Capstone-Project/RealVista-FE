import type { BehaviorEventDTO } from '@/entities/recommendation/model/types';
import { env } from '@/shared/lib/env';

/**
 * Behavior Event Queue
 *
 * Batches behavior events before sending to the BE API.
 * Reduces network requests by grouping events together.
 *
 * Flush triggers:
 * - Queue reaches MAX_QUEUE_SIZE (5 events)
 * - FLUSH_INTERVAL_MS elapsed (10 seconds)
 * - User leaves the page (visibilitychange / beforeunload)
 *
 * Uses navigator.sendBeacon() on page unload for reliable delivery.
 */

const MAX_QUEUE_SIZE = 5;
const FLUSH_INTERVAL_MS = 10_000;

let eventQueue: BehaviorEventDTO[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

function getApiUrl(): string {
  return `${env.NEXT_PUBLIC_API_ENDPOINT}/recommendations/behavior`;
}

function getAuthToken(): string | null {
  // Import dynamically to avoid circular deps
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuthTokenSync } = require('@/shared/lib/auth/get-auth-token');
  return getAuthTokenSync();
}

/**
 * Send events via fetch (normal flush)
 */
async function sendEvents(events: BehaviorEventDTO[]): Promise<void> {
  if (events.length === 0) return;

  const token = getAuthToken();
  if (!token) return; // No auth token = anonymous user, skip BE tracking

  try {
    await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: 'fe-client', // BE overrides with auth user
        events,
      }),
      keepalive: true, // Allow request to outlive the page
    });
  } catch {
    // Fire-and-forget: don't block UI on tracking failures
    console.warn('[EventQueue] Failed to send behavior events');
  }
}

/**
 * Send events via sendBeacon (page unload)
 * sendBeacon is guaranteed to be sent even if page is closing
 */
function sendEventsBeacon(events: BehaviorEventDTO[]): void {
  if (events.length === 0) return;

  const token = getAuthToken();
  if (!token) return;

  const blob = new Blob(
    [
      JSON.stringify({
        user_id: 'fe-client',
        events,
      }),
    ],
    { type: 'application/json' }
  );

  // sendBeacon doesn't support custom headers, so we append token as query param
  // BE should handle both header and query param auth for this endpoint
  // Fallback: use fetch with keepalive
  try {
    const sent = navigator.sendBeacon(getApiUrl(), blob);
    if (!sent) {
      // Fallback to fetch with keepalive
      fetch(getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: 'fe-client', events }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Last resort: ignore
  }
}

/**
 * Flush the queue — sends all queued events to BE
 */
export function flushEventQueue(): void {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];
  sendEvents(events);
}

/**
 * Enqueue a behavior event
 */
export function enqueueEvent(event: BehaviorEventDTO): void {
  eventQueue.push(event);

  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushEventQueue();
  }
}

/**
 * Initialize the event queue lifecycle listeners.
 * Call once on app mount.
 */
export function initEventQueue(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  // Periodic flush
  flushTimer = setInterval(flushEventQueue, FLUSH_INTERVAL_MS);

  // Flush when user leaves tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Use beacon for reliable delivery on tab hide
      const events = [...eventQueue];
      eventQueue = [];
      sendEventsBeacon(events);
    }
  });

  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    const events = [...eventQueue];
    eventQueue = [];
    sendEventsBeacon(events);
  });
}

/**
 * Cleanup — for testing or hot module reloading
 */
export function destroyEventQueue(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flushEventQueue();
  initialized = false;
}
