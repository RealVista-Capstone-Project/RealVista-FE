/**
 * Auth Feature - Model Layer
 *
 * This layer provides business logic and custom hooks for auth.
 * With NextAuth migration, we provide type-safe wrappers around
 * NextAuth's useSession for better separation of concerns.
 *
 * Exports:
 * - useAuthSession: Type-safe wrapper around useSession
 * - isAuthenticated: Type guard for checking auth state
 * - hasRole: Type guard for role-based access control
 * - getAccessToken: Helper to extract access token
 *
 * API hooks remain in src/features/auth/api/
 */

export { useAuthSession, isAuthenticated, hasRole, getAccessToken } from './use-auth-session';
export type { AuthSession } from './use-auth-session';
