import { auth } from '@/shared/lib/auth/config';
import { redirect } from '@/shared/config/i18n/navigation';
import { RegisterForm } from '@/features/auth/ui/register-form/register-form';
import { GoogleLoginButton } from '@/features/auth/ui/google-login-button';
import { Link } from '@/shared/config/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

/**
 * Register Page
 *
 * Provides a registration page with Role switching, email/password form,
 * and Google OAuth options. Matches the styling of LoginPage.
 */
export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Root Cause: Prevent logged-in users from accessing the register page
  const session = await auth();
  if (session) {
    redirect({ href: '/', locale });
  }

  const t = await getTranslations('Auth');

  return (
    <div className='flex min-h-[calc(100vh-80px)] items-center justify-center py-12'>
      <div className='w-full max-w-lg space-y-8 px-4'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-3xl font-bold tracking-tight'>Create an Account</h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            Enter your information to register for RealVista
          </p>
        </div>

        {/* Email/Password Form */}
        <div className='space-y-6'>
          <RegisterForm />
        </div>

        {/* Visual Separator */}
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>{t('continueWith') || 'Or continue with'}</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <div className='space-y-4 text-center'>
          <GoogleLoginButton />
        </div>

        {/* Footer Links */}
        <div className='text-center text-sm'>
          <p className='text-muted-foreground'>
            {t('hasAccount') || 'Already have an account?'}{' '}
            <Link
              href='/login'
              className='font-medium text-primary underline-offset-4 hover:underline'
            >
              {t('login') || 'Log In'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
