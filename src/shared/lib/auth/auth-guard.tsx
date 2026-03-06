'use client';

import { useEffect } from 'react';
import { useAuthSession } from '@/features/auth/model';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Protects pages that require the user to be logged in.
 * Shows a spinner while the session is loading.
 * Redirects to /unauthorized if the user is not authenticated.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useAuthSession();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/${locale}/unauthorized`);
    }
  }, [status, locale, router]);

  if (status === 'loading' || (status === 'unauthenticated' && !session?.user)) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-main-primary' />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return <>{children}</>;
}
