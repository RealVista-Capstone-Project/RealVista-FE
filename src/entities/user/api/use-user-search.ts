import { useQuery } from '@tanstack/react-query';
import { unwrapApiResponse } from '@/shared/types/api';
import { userApi } from './index';
import { userKeys } from './keys';
import { UserSearchResponse } from '../model/types';

/**
 * Hook to search for a user by email for owner assignment
 * Following the Option B convention: centralized unwrapping of the ApiResponse
 *
 * @param email The email to search for
 * @returns Query object with the unwrapped UserSearchResponse data
 */
export function useUserSearch(email: string) {
  return useQuery<UserSearchResponse, Error>({
    queryKey: userKeys.search(email),
    queryFn: async () => {
      const response = await userApi.searchByEmail(email);
      return unwrapApiResponse(response);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!email && email.includes('@'),
  });
}
