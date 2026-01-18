import { useQuery } from '@tanstack/react-query';
import { userQueries } from '@/entities/user/api';

/**
 * useCurrentUser Hook
 * Fetches current authenticated user using TanStack Query
 *
 * Note: This hook is now used with NextAuth. The NextAuth session
 * provides authentication state. This hook can be used to fetch
 * additional user data from the backend API if needed.
 *
 * @example
 * const { data, isLoading, error } = useCurrentUser()
 */
export function useCurrentUser() {
  const query = useQuery(userQueries.current());

  return query;
}

/**
 * useUserById Hook
 * Fetches a specific user by ID
 *
 * @example
 * const { data, isLoading, error } = useUserById('user-123')
 */
export function useUserById(id: string) {
  return useQuery(userQueries.detail(id));
}
