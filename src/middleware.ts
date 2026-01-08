/**
 * Middleware combining NextAuth v5 auth protection with next-intl
 *
 * This middleware:
 * 1. Uses NextAuth's auth() wrapper to check authentication
 * 2. Protects specific routes from unauthenticated access
 * 3. Preserves locale during auth redirects
 * 4. Integrates with next-intl for internationalization
 *
 * Flow:
 * - Public routes (/, /login, /register, etc.): No auth check, apply intl middleware
 * - Protected routes (/dashboard, /settings, /profile): Check auth, redirect to login if unauthenticated
 * - API routes, static files, Next.js internals: Excluded via matcher
 */

import { auth } from '@/shared/lib/auth/config';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/shared/config/i18n/routing';
import { NextResponse } from 'next/server';

// Create next-intl middleware for locale handling
const intlMiddleware = createMiddleware(routing);

// Define protected route prefixes (locale will be prepended)
// These routes require authentication
const protectedRoutes = ['/dashboard', '/settings', '/profile'];

// Define public routes (no auth required)
const publicRoutes = ['/home', '/about', '/login', '/register'];

/**
 * Main middleware function combining NextAuth auth and next-intl
 *
 * Auth wrapper adds `req.auth` property containing the session
 */
export default auth((req) => {
  const { nextUrl } = req;

  // Extract locale from pathname
  // Examples: /en/dashboard -> en, /vi/home -> vi, /dashboard -> (default: vi)
  const segments = nextUrl.pathname.split('/');
  const potentialLocale = segments[1];
  const isValidLocale = routing.locales.includes(potentialLocale as any);

  // Determine the locale (use pathname locale or default)
  const locale = isValidLocale ? potentialLocale : routing.defaultLocale;

  // Remove locale from pathname for route matching
  // /en/dashboard -> /dashboard
  const pathnameWithoutLocale = isValidLocale
    ? '/' + segments.slice(2).join('/')
    : nextUrl.pathname;

  // Check if this is a public route (with or without locale)
  const isPublicRoute =
    publicRoutes.some((route) => pathnameWithoutLocale.startsWith(route)) ||
    pathnameWithoutLocale === '/';

  // Allow public routes without auth check
  if (isPublicRoute) {
    return intlMiddleware(req);
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Protect routes: redirect to login if not authenticated
  if (isProtectedRoute && !req.auth) {
    // Preserve locale in redirect URL
    const loginUrl = new URL(`/${locale}/login`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Apply intl middleware for authenticated users or non-protected routes
  return intlMiddleware(req);
});

export const config = {
  // Matcher: exclude API routes, Next.js internals, and static files
  // - api: API routes (handled by NextAuth)
  // - _next: Next.js internals
  // - _vercel: Vercel internals
  // - *.*: Files with extensions (images, fonts, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
