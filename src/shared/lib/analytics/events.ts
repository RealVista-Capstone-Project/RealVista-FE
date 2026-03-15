/**
 * Behavior Event Constants
 *
 * Defines the event types and metadata shapes for user behavior tracking.
 * These constants are used by both PostHog and the BE behavior API.
 */

export const BEHAVIOR_EVENTS = {
  LISTING_VIEW: 'listing_view',
  LISTING_CLICK: 'listing_click',
  LISTING_BOOKMARK: 'listing_bookmark',
} as const;

export type BehaviorEventType = (typeof BEHAVIOR_EVENTS)[keyof typeof BEHAVIOR_EVENTS];

/**
 * Maps FE event types to BE event_type values.
 * BE expects: "view", "click", "bookmark"
 */
export const BEHAVIOR_EVENT_TO_API: Record<BehaviorEventType, string> = {
  listing_view: 'view',
  listing_click: 'click',
  listing_bookmark: 'bookmark',
};
