'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { updateAuthTokenCache } from './get-auth-token';

/**
 * AuthTokenProvider
 *
 * Keeps the in-memory token cache synchronized with NextAuth session.
 *
 * This provider uses useSession() to monitor session changes and updates
 * the synchronous token cache (getAuthTokenSync) via useEffect. This ensures
 * the HTTP client can access the current auth token with <1ms latency.
 *
 * Wrap this around your app content (inside SessionProvider) in root layout:
 *
 * @example
 * ```tsx
 * import { SessionProvider } from 'next-auth/react';
 * import { AuthTokenProvider } from '@/shared/lib/auth/auth-token-provider';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <SessionProvider>
 *       <AuthTokenProvider>
 *         {children}
 *       </AuthTokenProvider>
 *     </SessionProvider>
 *   );
 * }
 * ```
 *
 * @param children - React children to wrap
 *
 * @returns JSX.Element - Wrapped children with token sync enabled
 *
 * Performance:
 * - useEffect depends only on accessToken, not entire session object
 * - Prevents unnecessary cache updates when session fields other than token change
 * - Cache update is O(1) synchronous operation
 * - No re-renders triggered (fragment wrapper)
 *
 * Integration:
 * - Place inside SessionProvider in root layout
 * - Works with getAuthTokenSync() in HTTP client
 * - Automatically handles login/logout/token refresh
 */
export function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  // Update synchronously during render so the cache is ready before any child
  // TanStack Query fires its fetch (microtask, before useEffect).
  // Parent renders before children, so this runs before SettingsPage renders.
  const token = (session as unknown as { user?: { accessToken?: string } })?.user?.accessToken || null;
  updateAuthTokenCache(token);

  // Keep useEffect as well to handle async session updates after render
  useEffect(() => {
    updateAuthTokenCache(token);

  }, [token]);

  // Use fragment to avoid unnecessary DOM nodes
  return <>{children}</>;
}
