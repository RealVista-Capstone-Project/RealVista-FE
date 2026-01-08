'use client';

import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/entities/user/model/store';

/**
 * useAuth hook for migration period
 *
 * Wraps NextAuth session with Zustand fallback for backward compatibility.
 * This allows gradual migration of components from Zustand to NextAuth.
 *
 * Usage:
 * ```tsx
 * import { useAuth } from '@/features/auth/model/use-auth-nextauth';
 *
 * function MyComponent() {
 *   const { user, isAuthenticated, isMigrated, _source } = useAuth();
 *
 *   if (isMigrated) {
 *     // Using NextAuth
 *     console.log('NextAuth user:', user);
 *   } else {
 *     // Using Zustand (migration mode)
 *     console.log('Zustand user:', user);
 *   }
 * }
 * ```
 *
 * Migration path:
 * - Phase 2: Components use this hook with fallback
 * - Phase 4: All components migrated, remove fallback
 * - Phase 5: Delete Zustand store, use NextAuth directly
 *
 * @returns Auth state with migration tracking
 */
export function useAuth() {
  // Try NextAuth first
  const { data: session, status } = useSession();
  const zustandAuth = useAuthStore();

  // Determine auth source and status
  const isNextAuth = status === 'authenticated';
  const isLoading = status === 'loading';
  const isAuthenticated = isNextAuth || zustandAuth.isAuthenticated;
  const isMigrated = isNextAuth; // True when using NextAuth

  // Get user from appropriate source
  // NextAuth user structure: { id, email, name, role, avatar }
  // Zustand user structure: same (defined in entities/user)
  const user = session?.user || zustandAuth.user;

  return {
    // User data
    user,
    isAuthenticated,

    // Migration tracking
    isMigrated,
    isLoading,
    _source: isNextAuth ? 'nextauth' : 'zustand',

    // NextAuth-specific (available when migrated)
    session: isNextAuth ? session : null,
    status: isNextAuth ? status : 'unauthenticated',
  };
}

/**
 * Type declarations for the auth hook return type
 */
export type UseAuthReturn = ReturnType<typeof useAuth>;
