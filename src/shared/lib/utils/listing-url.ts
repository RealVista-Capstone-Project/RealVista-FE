/**
 * Build listing detail URL from slug
 * @param locale - The current locale (e.g., 'en', 'vi')
 * @param slug - The listing slug (e.g., 'luxury-apartment-i.123')
 * @returns The full listing detail URL path
 */
export function buildListingDetailUrl(locale: string, slug: string): string {
  return `/${locale}/listing/${slug}`;
}
