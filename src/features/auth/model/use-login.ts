import { useMutation } from '@tanstack/react-query'
import { userApi } from '@/entities/user/api'
import { useAuthStore } from '@/entities/user/model/store'
import type { LoginCredentials } from '@/entities/user/model/types'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * useLogin Hook
 * Mutation hook for user login
 * Handles login flow with success/error handling
 */
export function useLogin() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => userApi.login(credentials),
    onSuccess: (response) => {
      const { token, user, expiresIn } = response.payload
      // Store token and session
      localStorage.setItem('token', token)
      setSession({
        token,
        user,
        expiresAt: Date.now() + expiresIn * 1000,
      })

      // Show success message
      toast.success('Login successful!')

      // Redirect to dashboard
      router.push('/dashboard')
    },
    onError: (error: unknown) => {
      toast.error('Login failed', {
        description: (error as any)?.payload?.message || 'Invalid credentials',
      })
    },
  })
}
