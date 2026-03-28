import { auth } from '@/shared/lib/auth/config';
import { redirect } from '@/shared/config/i18n/navigation';
import { LoginFormNextAuth } from '@/features/auth/ui/login-form-nextauth';
import { GoogleLoginButton } from '@/features/auth/ui/google-login-button';
import { Link } from '@/shared/config/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

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
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Root Cause: Prevent logged-in users from accessing the login page
  const session = await auth();
  if (session) {
    redirect({ href: '/', locale });
  }

  const t = await getTranslations('Auth');
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='w-full max-w-md space-y-8 px-4'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-3xl font-bold tracking-tight'>{t('welcomeBack')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('signInMessage')}</p>
        </div>

        {/* Email/Password Form */}
        <div className='space-y-4'>
          <LoginFormNextAuth />
        </div>

        {/* Visual Separator */}
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>{t('continueWith')}</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <div className='space-y-4'>
          <GoogleLoginButton />
        </div>

        {/* Footer Links */}
        <div className='text-center text-sm'>
          <p className='text-muted-foreground'>
            {t('noAccount')}{' '}
            <Link
              href='/register'
              className='font-medium text-primary underline-offset-4 hover:underline'
            >
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
