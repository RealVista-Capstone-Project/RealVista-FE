import { useCallback, useRef } from 'react';
import { useIngestBehavior } from './api';
import type { BehaviorEvent, BehaviorEventType } from '@/entities/recommendation';

/**
 * Hook to track user behavior events
 * Batches events and sends them to the backend
 */
export function useTrackBehavior() {
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

  const track = useCallback(
    (
      eventType: BehaviorEventType,
      listingId: string,
      options?: {
        durationSeconds?: number;
        metadata?: Record<string, unknown>;
      }
    ) => {
      const event: BehaviorEvent = {
        event_type: eventType,
        listing_id: listingId,
        duration_seconds: options?.durationSeconds,
        metadata: options?.metadata,
      };

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

  return {
    track,
    flush: flushEvents,
  };
}
