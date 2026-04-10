/**
 * User Query Keys
 * Centralized query keys for TanStack Query
 * Provides type-safe query keys for invalidation and caching
 */
export const userKeys = {
  // Base key for all user queries
  all: ['users'] as const,

  // All user lists (with optional filters)
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), filters] as const,

  // Single user queries
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,

  // Current authenticated user
  current: () => [...userKeys.all, 'current'] as const,

  // Current user (me) - full profile from /me endpoint
  me: () => [...userKeys.all, 'me'] as const,

  // Current user's profile
  profile: () => [...userKeys.current(), 'profile'] as const,

  // User sessions
  sessions: () => [...userKeys.current(), 'sessions'] as const,

  // Search user by email
  search: (email: string) => [...userKeys.all, 'search', email] as const,
} as const
