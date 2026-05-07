/**
 * Listing Analytics Types
 * Domain models for listing performance metrics
 */

/**
 * Analytics metrics for a listing
 */
export interface ListingAnalytics {
  total_views: number;
  unique_viewers: number;
  tour_bookings: number;
  conversion_rate: number;
}

/** One day in weekly views breakdown (ISO date yyyy-MM-dd). */
export interface ListingDailyViewsDay {
  date: string;
  views: number;
}

/** Mon–Sun view counts for the week containing {@link week_start}. */
export interface ListingWeeklyViews {
  week_start: string;
  days: ListingDailyViewsDay[];
}
