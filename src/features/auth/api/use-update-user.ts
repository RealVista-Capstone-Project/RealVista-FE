import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, userQueries } from '@/entities/user/api';
import type { UpdateUserData } from '@/entities/user/model/types';

/**
 * useUpdateProfile Hook
 * Mutation hook for updating user profile
 *
 * @example
 * const { mutate, isPending } = useUpdateProfile()
 * mutate({ name: 'John Doe' })
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserData) => userApi.update(data),
    onSuccess: (response) => {
      // Invalidate and refetch - NextAuth session will be updated via useSession
      queryClient.invalidateQueries({ queryKey: userQueries.current().queryKey });
    },
  });
}

/**
 * useChangePassword Hook
 * Mutation hook for changing password
 *
 * @example
 * const { mutate, isPending } = useChangePassword()
 * mutate({ oldPassword: 'old', newPassword: 'new' })
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      userApi.changePassword(data),
    onSuccess: () => {
      // Invalidate session queries
      queryClient.invalidateQueries({ queryKey: userQueries.current().queryKey });
    },
  });
}

/**
 * useUploadAvatar Hook
 * Mutation hook for uploading user avatar
 *
 * @example
 * const { mutate, isPending } = useUploadAvatar()
 * mutate(file)
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file),
    onSuccess: (response) => {
      // Invalidate and refetch - NextAuth session will be updated via useSession
      queryClient.invalidateQueries({ queryKey: userQueries.current().queryKey });
    },
  });
}
