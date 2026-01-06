import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, userQueries } from '@/entities/user/api';
import { useAuthStore } from '@/entities/user/model/store';
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
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (data: UpdateUserData) => userApi.update(data),
    onSuccess: (response) => {
      // Update Zustand store with payload
      updateUser(response.payload);
      // Invalidate and refetch
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
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file),
    onSuccess: (response) => {
      // Update user avatar in store
      updateUser({ avatar: response.payload.url });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: userQueries.current().queryKey });
    },
  });
}
