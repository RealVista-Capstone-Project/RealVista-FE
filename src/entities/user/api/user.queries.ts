import { queryOptions } from '@tanstack/react-query'
import { userApi } from './index'
import { userKeys } from './keys'

/**
 * User Query Factory
 * TanStack Query v5 queryOptions for type-safe queries
 * Uses userKeys from keys.ts for consistent query key management
 */
export const userQueries = {
  /**
   * Get list of users
   */
  list: () =>
    queryOptions({
      queryKey: userKeys.lists(),
      queryFn: () => userApi.list(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),

  /**
   * Get single user by ID
   */
  detail: (id: string) =>
    queryOptions({
      queryKey: userKeys.detail(id),
      queryFn: () => userApi.getById(id),
      staleTime: 5 * 60 * 1000,
      enabled: !!id,
    }),

  /**
   * Get current authenticated user
   */
  current: () =>
    queryOptions({
      queryKey: userKeys.current(),
      queryFn: () => userApi.getCurrent(),
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }),

  /**
   * Get current user full profile from /me endpoint
   */
  me: () =>
    queryOptions({
      queryKey: userKeys.me(),
      queryFn: () => userApi.getMe(),
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }),

  /**
   * Get user sessions
   */
  sessions: () =>
    queryOptions({
      queryKey: userKeys.sessions(),
      queryFn: () => userApi.list(),
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),
} as const
