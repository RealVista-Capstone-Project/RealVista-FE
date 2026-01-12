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

  useEffect(() => {
    // Extract accessToken from session (type-safe)
    // Session object structure from NextAuth:
    // {
    //   user: {
    //     id: string,
    //     email: string,
    //     name: string,
    //     role: 'user' | 'admin' | 'moderator',
    //     avatar?: string,
    //     accessToken?: string  // <-- This is what we cache
    //   },
    //   expires: string
    // }
    const token = (session as unknown as { user?: { accessToken?: string } })?.user?.accessToken || null;
    updateAuthTokenCache(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.accessToken]); // Depend only on accessToken, not entire session

  // Use fragment to avoid unnecessary DOM nodes
  return <>{children}</>;
}
