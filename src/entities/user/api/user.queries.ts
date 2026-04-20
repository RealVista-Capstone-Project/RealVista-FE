import { queryOptions } from '@tanstack/react-query';
import { userApi } from './index';
import { userKeys } from './keys';
import type { UserFilterParams } from '../model/types';
import { unwrapApiResponse } from '@/shared/types/api';

/**
 * User Query Factory
 * TanStack Query v5 queryOptions for type-safe queries
 * Uses userKeys from keys.ts for consistent query key management
 */
export const userQueries = {
  /**
   * Get paginated users (Admin only)
   */
  paged: (params?: UserFilterParams & { page?: number; size?: number; sort?: string }) =>
    queryOptions({
      queryKey: userKeys.list(params),
      queryFn: () => userApi.getPagedUsers(params).then(unwrapApiResponse),
    }),

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
      queryFn: () => userApi.getById(id).then(unwrapApiResponse),
      staleTime: 5 * 60 * 1000,
      enabled: !!id,
    }),

  /**
   * Get current authenticated user — returns raw UserProfile (snake_case)
   */
  current: () =>
    queryOptions({
      queryKey: userKeys.current(),
      queryFn: async () => {
        const response = await userApi.getMe();
        return response.payload.data; // UserProfile with snake_case fields
      },
      staleTime: 5 * 60 * 1000,
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
  /**
   * Search user by email for owner assignment
   */
  searchByEmail: (email: string) =>
    queryOptions({
      queryKey: userKeys.search(email),
      queryFn: () => userApi.searchByEmail(email),
      staleTime: 1 * 60 * 1000, // 1 minute
      enabled: !!email && email.includes('@'),
    }),
} as const;
