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
