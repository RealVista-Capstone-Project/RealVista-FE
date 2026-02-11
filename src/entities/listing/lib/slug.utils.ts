/**
 * Utility functions for generating and parsing listing slugs
 */

/**
 * Generate a SEO-friendly slug for listing URLs
 * Format: {listing-name}-i.{listing-id}
 * Example: luxury-2-bedroom-apartment-nguyen-hue-i.610e8400-e29b-41d4-a716-446655440001
 */
export function generateListingSlug(name: string, listingId: string): string {
  // Convert name to URL-friendly format
  const slugName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();

  return `${slugName}-i.${listingId}`;
}

/**
 * Extract listing_id from slug URL
 * Slug format: {listing-name}-i.{listing-id}
 * Example: luxury-2-bedroom-apartment-nguyen-hue-i.610e8400-e29b-41d4-a716-446655440001
 */
export function extractListingId(slug: string): string {
  // Find the last occurrence of '-i.' separator
  const separatorIndex = slug.lastIndexOf('-i.');

  if (separatorIndex !== -1) {
    // Extract the ID after '-i.'
    const listingId = slug.substring(separatorIndex + 3); // +3 to skip '-i.'

    // Validate it's a valid UUID (basic check)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(listingId)) {
      return listingId;
    }
  }

  // If no valid pattern found, return the slug as-is (for backward compatibility)
  return slug;
}
