'use client';

import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';
import type { BehaviorEventType } from '@/entities/recommendation';

/**
 * Hook to track listing-related events with PostHog
 *
 * Events are automatically captured by PostHog and synced to the backend
 * via the PostHogRecommendationSync provider.
 *
 * @example
 * ```tsx
 * const { trackListing } = usePostHogTracking();
 *
 * // Track listing view
 * trackListing('VIEW', listingId, {
 *   durationSeconds: 120,
 *   metadata: { source: 'homepage' }
 * });
 * ```
 */
export function usePostHogTracking() {
  const posthog = usePostHog();

  const trackListing = useCallback(
    (
      eventType: BehaviorEventType,
      listingId: string,
      options?: {
        durationSeconds?: number;
        metadata?: Record<string, unknown>;
      }
    ) => {
      if (!posthog) return;

      // Map behavior type to PostHog event name
      const eventNameMap: Record<BehaviorEventType, string> = {
        VIEW: 'listing_viewed',
        CLICK: 'listing_clicked',
        BOOKMARK: 'listing_bookmarked',
        SEARCH: 'listing_searched',
        INQUIRY: 'listing_inquiry_sent',
        SHARE: 'listing_shared',
      };

      const eventName = eventNameMap[eventType];

      // Capture event in PostHog
      posthog.capture(eventName, {
        listing_id: listingId,
        duration_seconds: options?.durationSeconds,
        metadata: options?.metadata,
        timestamp: new Date().toISOString(),
      });
    },
    [posthog]
  );

  return {
    trackListing,
  };
}
