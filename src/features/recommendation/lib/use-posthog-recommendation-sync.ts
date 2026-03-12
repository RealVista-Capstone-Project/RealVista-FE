'use client';

import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useRef } from 'react';
import { useIngestBehavior } from '../api';
import type { BehaviorEvent, BehaviorEventType } from '@/entities/recommendation';

/**
 * PostHog Event Sync Manager
 *
 * Listens to PostHog events and automatically batches them for backend ingestion.
 * Filters for listing-related events and sends them to the recommendation API.
 */
export function usePostHogRecommendationSync() {
  const posthog = usePostHog();
  const { mutate } = useIngestBehavior();
  const eventsBuffer = useRef<BehaviorEvent[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushEvents = useCallback(() => {
    if (eventsBuffer.current.length > 0) {
      mutate({ events: [...eventsBuffer.current] });
      eventsBuffer.current = [];
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [mutate]);

  const addEventToBuffer = useCallback(
    (event: BehaviorEvent) => {
      eventsBuffer.current.push(event);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Flush after 5 seconds or when buffer reaches 10 events
      if (eventsBuffer.current.length >= 10) {
        flushEvents();
      } else {
        timeoutRef.current = setTimeout(flushEvents, 5000);
      }
    },
    [flushEvents]
  );

  useEffect(() => {
    if (!posthog) return;

    // Subscribe to PostHog events
    const eventListener = (eventName: string, eventData: Record<string, unknown>) => {
      // Map PostHog events to recommendation events
      const eventMapping: Record<string, BehaviorEventType | null> = {
        listing_viewed: 'VIEW',
        listing_clicked: 'CLICK',
        listing_bookmarked: 'BOOKMARK',
        listing_searched: 'SEARCH',
        listing_inquiry_sent: 'INQUIRY',
        listing_shared: 'SHARE',
      };

      const behaviorType = eventMapping[eventName];
      if (!behaviorType) return;

      const listingId = eventData.listing_id as string | undefined;
      if (!listingId) return;

      const event: BehaviorEvent = {
        event_type: behaviorType,
        listing_id: listingId,
        duration_seconds: eventData.duration_seconds as number | undefined,
        metadata: eventData.metadata as Record<string, unknown> | undefined,
      };

      addEventToBuffer(event);
    };

    // Register event callback
    posthog.on('event', eventListener);

    // Flush on page unload
    const handleBeforeUnload = () => {
      flushEvents();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      posthog.off('event', eventListener);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushEvents();
    };
  }, [posthog, addEventToBuffer, flushEvents]);

  return {
    flush: flushEvents,
  };
}
