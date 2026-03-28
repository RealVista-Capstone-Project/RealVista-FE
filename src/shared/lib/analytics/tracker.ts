import { posthog } from './posthog';
import { BEHAVIOR_EVENTS, BEHAVIOR_EVENT_TO_API } from './events';
import { enqueueEvent, initEventQueue } from './event-queue';
import type { BehaviorEventDTO } from '@/entities/recommendation/model/types';

/**
 * Behavior Event Metadata
 *
 * Additional context sent with each event.
 * Used by both PostHog (analytics) and BE (recommendation engine).
 */
export interface BehaviorEventMetadata {
  listing_type?: 'RENT' | 'SALE';
  property_type?: string;
  price?: number;
  source_page?: 'home' | 'buy' | 'rent' | 'detail' | 'search' | 'similar' | 'map';
  position?: number;
}

/**
 * Unified Behavior Tracker
 *
 * Dual-write pattern:
 * 1. PostHog — for analytics dashboards, funnels, retention
 * 2. BE API (via event queue) — for AI recommendation engine (Qdrant)
 *
 * Each method:
 * - Captures event in PostHog with full metadata
 * - Enqueues event for batched delivery to BE API
 */
export const behaviorTracker = {
  /**
   * Initialize the tracker. Call once on app mount.
   */
  init(): void {
    if (typeof window !== 'undefined') {
      initEventQueue();
    }
  },

  /**
   * Track when a user views a listing detail page.
   */
  trackView(listingId: string, metadata?: BehaviorEventMetadata): void {
    // PostHog
    posthog.capture(BEHAVIOR_EVENTS.LISTING_VIEW, {
      listing_id: listingId,
      ...metadata,
    });

    // BE API queue
    const event: BehaviorEventDTO = {
      event_type: BEHAVIOR_EVENT_TO_API[BEHAVIOR_EVENTS.LISTING_VIEW],
      listing_id: listingId,
      metadata: metadata ? { ...metadata } : null,
    };
    enqueueEvent(event);
  },

  /**
   * Track when a user clicks on a listing card (from list/grid/similar).
   */
  trackClick(listingId: string, metadata?: BehaviorEventMetadata): void {
    // PostHog
    posthog.capture(BEHAVIOR_EVENTS.LISTING_CLICK, {
      listing_id: listingId,
      ...metadata,
    });

    // BE API queue
    const event: BehaviorEventDTO = {
      event_type: BEHAVIOR_EVENT_TO_API[BEHAVIOR_EVENTS.LISTING_CLICK],
      listing_id: listingId,
      metadata: metadata ? { ...metadata } : null,
    };
    enqueueEvent(event);
  },

  /**
   * Track when a user bookmarks/unbookmarks a listing.
   */
  trackBookmark(
    listingId: string,
    action: 'add' | 'remove',
    metadata?: BehaviorEventMetadata
  ): void {
    // PostHog
    posthog.capture(BEHAVIOR_EVENTS.LISTING_BOOKMARK, {
      listing_id: listingId,
      action,
      ...metadata,
    });

    // BE API queue — only track "add" for recommendation (remove = negative signal, optional)
    if (action === 'add') {
      const event: BehaviorEventDTO = {
        event_type: BEHAVIOR_EVENT_TO_API[BEHAVIOR_EVENTS.LISTING_BOOKMARK],
        listing_id: listingId,
        metadata: metadata ? { ...metadata } : null,
      };
      enqueueEvent(event);
    }
  },
};
