import { getSession } from 'next-auth/react';

/**
 * In-memory cache for auth token (synchronous, ultra-fast)
 * Updated via useSession effect in AuthTokenProvider
 *
 * Performance: <1ms for O(1) variable access
 */
let cachedToken: string | null = null;

/**
 * Async token retrieval from NextAuth session
 * Use this for initial load or when you need fresh session data
 *
 * The Session type is already extended in src/shared/lib/auth/types.ts
 * to include the accessToken field on the user object.
 *
 * @returns Promise<string | null> - Access token or null
 *
 * Time: 50-200ms (network latency to NextAuth session endpoint)
 *
 * @example
 * ```ts
 * const token = await getAuthToken();
 * if (token) {
 *   // Make authenticated request
 * }
 * ```
 */
export async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  // Session type is extended via module augmentation in types.ts
  return (session as { user?: { accessToken?: string } | null })?.user?.accessToken || null;
}

/**
 * Synchronous cache read
 * Use this in HTTP client for zero-latency token access
 *
 * @returns string | null - Cached access token or null
 *
 * Time: <1ms (O(1) variable access)
 *
 * @example
 * ```ts
 * // In HTTP client
 * const token = getAuthTokenSync();
 * if (token) {
 *   headers.Authorization = `Bearer ${token}`;
 * }
 * ```
 */
export function getAuthTokenSync(): string | null {
  return cachedToken;
}

/**
 * Update the token cache
 * Call this from AuthTokenProvider's useSession effect
 *
 * @param token - New token value (null if no session)
 *
 * @example
 * ```ts
 * // In AuthTokenProvider
 * useEffect(() => {
 *   updateAuthTokenCache(session?.accessToken || null);
 * }, [session]);
 * ```
 */
export function updateAuthTokenCache(token: string | null): void {
  cachedToken = token;
}
