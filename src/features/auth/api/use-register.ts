import { useMutation } from '@tanstack/react-query';
import { userApi } from '@/entities/user/api';

export function useRegister() {
  return useMutation({
    mutationFn: userApi.register,
  });
}
