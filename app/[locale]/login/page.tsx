import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';

/**
 * Login Page
 *
 * NextAuth-powered login page with email/password and Google OAuth options.
 *
 * Features:
 * - Email/password authentication via NextAuth Credentials provider
 * - Google OAuth login via backend OAuth flow
 * - Visual separator between login methods
 * - Locale-aware routing (supports /vi and /en)
 */
export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('Auth');
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='w-full max-w-md space-y-8 px-4'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-3xl font-bold tracking-tight'>{t('welcomeBack')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('signInMessage')}</p>
        </div>
      </div>
    </div>
  );
}
