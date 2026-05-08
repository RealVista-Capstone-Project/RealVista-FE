import { differenceInHours, parseISO } from 'date-fns';

export const LISTING_PUBLISHED_MAX_LIFETIME_DAYS = 14;

export const LISTING_PUBLISHED_MAX_LIFETIME_HOURS =
  LISTING_PUBLISHED_MAX_LIFETIME_DAYS * 24;

/**
 * Hours left before a published listing auto-unpublishes (14-day window from {@link publishedAt}).
 * Returns {@code null} when not applicable.
 */
export function computePublishedHoursRemaining(
  publishedAt: string | null | undefined,
  status: string,
  now: Date = new Date()
): number | null {
  if (status !== 'PUBLISHED' || !publishedAt) {
    return null;
  }

  const publishedDate = parseISO(publishedAt);
  return LISTING_PUBLISHED_MAX_LIFETIME_HOURS - differenceInHours(now, publishedDate);
}
