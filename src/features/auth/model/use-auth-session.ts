import { useSession } from 'next-auth/react';

/**
 * Extended Session interface with accessToken and role
 * This extends the default NextAuth Session type
 */
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: 'user' | 'owner' | 'admin' | 'moderator';
    accessToken?: string;
    backendRoles?: string[];
  };
  expires: string;
}

/**
 * Custom hook that wraps NextAuth's useSession
 *
 * This hook provides type-safe access to the auth session with custom fields
 * like accessToken and role. It follows FSD architecture by providing
 * a feature-level abstraction over NextAuth's useSession.
 *
 * @returns Object containing session data and status
 *
 * @example
 * ```tsx
 * import { useAuthSession } from '@/features/auth/model';
 *
 * function Dashboard() {
 *   const { data: session, status } = useAuthSession();
 *
 *   if (status === 'loading') return <Loading />;
 *   if (!session) return <LoginPrompt />;
 *
 *   return <Welcome email={session.user.email} />;
 * }
 * ```
 */
export function useAuthSession() {
  const { data, status, update } = useSession();

  return {
    data: data as AuthSession | null,
    status,
    update,
  };
}

/**
 * Type guard to check if user is authenticated
 *
 * @example
 * ```tsx
 * const { data: session } = useAuthSession();
 * if (isAuthenticated(session)) {
 *   // session.user is guaranteed to exist here
 * }
 * ```
 */
export function isAuthenticated(session: AuthSession | null): session is AuthSession {
  return session !== null;
}

/**
 * Type guard to check if user has a specific role
 *
 * @example
 * ```tsx
 * const { data: session } = useAuthSession();
 * if (hasRole(session, 'admin')) {
 *   // User is an admin
 * }
 * ```
 */
export function hasRole(
  session: AuthSession | null,
  role: 'user' | 'owner' | 'admin' | 'moderator'
): boolean {
  return session?.user?.role === role;
}

/**
 * Get the access token from session
 * Returns null if session is invalid or token is missing
 *
 * @example
 * ```tsx
 * const { data: session } = useAuthSession();
 * const token = getAccessToken(session);
 * if (token) {
 *   // Make authenticated request
 * }
 * ```
 */
export function getAccessToken(session: AuthSession | null): string | null {
  return session?.user?.accessToken || null;
}
