'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';

const BACKEND_OAUTH_URL = 'http://localhost:8080/api/v1/auth/login-google';

/**
 * GoogleLoginButton Component
 *
 * Redirects to backend OAuth endpoint for Google authentication.
 * The backend handles the OAuth flow and redirects back to /auth/callback.
 *
 * Features:
 * - Google's official branding with multi-color 'G' icon
 * - Loading state with spinner
 * - Locale-aware callback URL
 * - Full-width button with outline variant
 *
 * Usage:
 * ```tsx
 * import { GoogleLoginButton } from '@/features/auth/ui';
 *
 * export function LoginPage() {
 *   return <GoogleLoginButton />;
 * }
 * ```
 */
export function GoogleLoginButton() {
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);

    // Construct the callback URL with current locale
    const callbackUrl = `${window.location.origin}/${locale}/auth/callback`;

    // Construct the OAuth URL with redirect_uri parameter
    const oauthUrl = `${BACKEND_OAUTH_URL}?redirect_uri=${encodeURIComponent(callbackUrl)}`;

    // Redirect to backend OAuth endpoint
    window.location.href = oauthUrl;
  };

  return (
    <Button
      variant='outline'
      className='w-full'
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Continue with Google
        </>
      ) : (
        <>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            className='mr-2 h-4 w-4'
            aria-hidden='true'
          >
            <path
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              fill='#4285F4'
            />
            <path
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              fill='#34A853'
            />
            <path
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              fill='#FBBC05'
            />
            <path
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              fill='#EA4335'
            />
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  );
}
