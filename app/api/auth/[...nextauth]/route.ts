import { handlers } from '@/shared/lib/auth/config';

/**
 * NextAuth API Route Handler
 *
 * This route handles all NextAuth authentication endpoints:
 * - /api/auth/signin - Sign in page
 * - /api/auth/signout - Sign out
 * - /api/auth/callback - OAuth callbacks (if added later)
 * - /api/auth/session - Get current session
 * - /api/auth/csrf - CSRF token
 * - /api/auth/providers - List available providers
 *
 * Exports GET and POST handlers from NextAuth configuration
 */
export const { GET, POST } = handlers;
