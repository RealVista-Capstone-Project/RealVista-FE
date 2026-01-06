import { useAuthStore } from '@/entities/user';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * useAuth Hook
 * Authentication business logic layer
 * Wraps entity store and adds auth-specific functionality
 */
export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, clearSession } = useAuthStore();

  /**
   * Logout user and redirect to login
   */
  const logout = useCallback(() => {
    clearSession();
    localStorage.removeItem('token');
    router.push('/login');
  }, [clearSession, router]);

  /**
   * Require authentication
   * Redirects to login if not authenticated
   */
  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  /**
   * Check if user has specific role
   */
  const hasRole = (role: string) => {
    return user?.role === role;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = () => hasRole('admin');

  return {
    user,
    isAuthenticated,
    logout,
    requireAuth,
    hasRole,
    isAdmin,
  };
}
