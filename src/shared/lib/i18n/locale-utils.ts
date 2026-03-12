/**
 * Locale handling utilities
 *
 * These utilities work with next-intl's locale detection which follows:
 * 1. Locale prefix in pathname
 * 2. Cookie with previously detected locale
 * 3. Accept-Language header
 * 4. Default locale
 */

import { routing } from '@/shared/config/i18n/routing';

/**
 * Extract pathname without locale prefix
 *
 * This relies on next-intl's locale detection which follows:
 * 1. Locale prefix in pathname
 * 2. Cookie with previously detected locale
 * 3. Accept-Language header
 * 4. Default locale
 *
 * @param pathname - Full pathname from request
 * @returns pathname without locale prefix
 *
 * @example
 * ```ts
 * stripLocale('/en/dashboard') // '/dashboard'
 * stripLocale('/vi/home') // '/home'
 * stripLocale('/dashboard') // '/dashboard' (no prefix)
 * ```
 */
export function stripLocale(pathname: string): string {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];

  // Check if first segment is a valid locale
  if (routing.locales.includes(potentialLocale as 'en' | 'vi')) {
    // Remove locale prefix
    return '/' + segments.slice(2).join('/');
  }

  // No locale prefix found
  return pathname;
}

/**
 * Get the default locale from routing configuration
 */
export function getDefaultLocale(): string {
  return routing.defaultLocale;
}

/**
 * Create a localized URL with the given locale
 *
 * @param locale - Locale code (e.g., 'en', 'vi')
 * @param pathname - Pathname without locale (e.g., '/dashboard')
 * @param baseUrl - Base URL from request
 * @returns Full URL with locale prefix
 *
 * @example
 * ```ts
 * createLocaleUrl('en', '/dashboard', 'https://example.com')
 * // Returns: URL object for 'https://example.com/en/dashboard'
 * ```
 */
export function createLocaleUrl(locale: string, pathname: string, baseUrl: string): URL {
  // Ensure pathname doesn't start with slash (we'll add it)
  const cleanPathname = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const localizedPath = `/${locale}/${cleanPathname}`;
  return new URL(localizedPath, baseUrl);
}
