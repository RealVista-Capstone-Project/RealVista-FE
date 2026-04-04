import posthog from 'posthog-js';
import { env } from '@/shared/lib/env';

/**
 * PostHog Client Singleton
 *
 * Initializes PostHog analytics on the client side only.
 * Must be called once during app bootstrap (inside PostHogProvider).
 *
 * Configuration:
 * - person_profiles: 'identified_only' — only creates person profiles for identified users
 * - capture_pageview: false — we handle pageviews manually for App Router SPA navigation
 * - capture_pageleave: true — auto-track page leave events
 */
let posthogInitialized = false;

export function getPostHogClient() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!posthogInitialized) {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      loaded: (ph) => {
        // Disable in development to avoid polluting data
        if (process.env.NODE_ENV === 'development') {
          ph.debug();
        }
      },
    });
    posthogInitialized = true;
  }

  return posthog;
}

export { posthog };
