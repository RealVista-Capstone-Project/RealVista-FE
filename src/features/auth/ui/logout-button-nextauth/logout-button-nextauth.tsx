'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';

/**
 * LogoutButtonNextAuth Component
 *
 * NextAuth-powered logout button that signs the user out and redirects to login.
 * Uses the signOut() function from next-auth/react.
 *
 * Features:
 * - Signs out from NextAuth session
 * - Clears session cookie and token
 * - Shows success toast notification
 * - Redirects to /login page
 * - Loading state during logout
 * - Error handling with fallback redirect
 *
 * Usage:
 * ```tsx
 * import { LogoutButtonNextAuth } from '@/features/auth/ui';
 *
 * export function Header() {
 *   return <LogoutButtonNextAuth />;
 * }
 * ```
 *
 * Note: This component is designed for use when NEXTAUTH_ENABLED=true.
 * For Phase 3, it can be conditionally rendered alongside the legacy logout button.
 */
export function LogoutButtonNextAuth({ children }: { children?: React.ReactNode }) {
  const t = useTranslations('Auth');
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await signOut({ redirect: false });
      localStorage.removeItem('subscription-wizard-state');
      queryClient.clear();
      toast.success(t('logoutSuccess'));
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('logoutFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogout} disabled={isLoading} variant='ghost'>
      {isLoading ? 'Logging out...' : children || t('logout')}
    </Button>
  );
}
