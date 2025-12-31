import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { userQueries } from '@/entities/user/api'
import { useAuthStore } from '@/entities/user/model/store'

/**
 * useCurrentUser Hook
 * Fetches current authenticated user using TanStack Query
 * Automatically updates Zustand store when data changes
 *
 * @example
 * const { data, isLoading, error } = useCurrentUser()
 */
export function useCurrentUser() {
  const setUser = useAuthStore((state) => state.setUser)

  const query = useQuery(userQueries.current())

  // Update store when data changes
  useEffect(() => {
    if (query.data) {
      setUser(query.data.payload)
    }
  }, [query.data, setUser])

  return query
}

/**
 * useUserById Hook
 * Fetches a specific user by ID
 *
 * @example
 * const { data, isLoading, error } = useUserById('user-123')
 */
export function useUserById(id: string) {
  return useQuery(userQueries.detail(id))
}
