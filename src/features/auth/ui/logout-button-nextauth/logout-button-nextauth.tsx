'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
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
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Sign out from NextAuth
      // redirect: false allows us to handle the redirect manually
      const result = await signOut({ redirect: false });

      // Check if signOut was successful
      if (result) {
        // Show success message
        toast.success(t('logoutSuccess'));

        // Redirect to login page with current locale
        router.push(`/${locale}/login`);
      } else {
        // If signOut returns undefined/null, treat as error
        throw new Error('Logout returned undefined result');
      }
    } catch (error) {
      // Handle any errors during logout
      console.error('Logout error:', error);
      toast.error(t('logoutFailed'));

      // Still redirect to login page even on error for UX
      // This ensures users aren't stuck in a broken state
      router.push(`/${locale}/login`);
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
