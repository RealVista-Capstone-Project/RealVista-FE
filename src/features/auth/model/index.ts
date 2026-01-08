/**
 * Auth Feature - Model Layer
 *
 * This layer previously contained Zustand-based auth hooks.
 * With NextAuth migration, auth is now handled directly via:
 * - useSession() from 'next-auth/react' for session management
 * - signIn() / signOut() from 'next-auth/react' for auth operations
 *
 * API hooks remain in src/features/auth/api/
 */
