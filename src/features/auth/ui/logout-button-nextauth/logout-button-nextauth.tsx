'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
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
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Sign out from NextAuth
      // redirect: false allows us to handle the redirect manually
      await signOut({ redirect: false });

      // Show success message
      toast.success('Logged out successfully');

      // Redirect to login page with current locale
      router.push(`/${locale}/login`);
    } catch (error) {
      // Handle any errors during logout
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogout} disabled={isLoading} variant='ghost'>
      {isLoading ? 'Logging out...' : children || 'Logout'}
    </Button>
  );
}
