import { auth } from '@/shared/lib/auth/config';
import { redirect } from '@/shared/config/i18n/navigation';
import { LoginFormNextAuth } from '@/features/auth/ui/login-form-nextauth';
import { GoogleLoginButton } from '@/features/auth/ui/google-login-button';
import { Link } from '@/shared/config/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PropertyCardFeatured } from '@/shared/ui/property-card-featured';
import RealVistaLogo from '@/shared/assets/logo/logo';
import { Suspense } from 'react';

/**
 * Login Page
 *
 * NextAuth-powered login page with email/password and Google OAuth options.
 *
 * Features:
 * - Email/password authentication via NextAuth Credentials provider
 * - Google OAuth login via backend OAuth flow
 * - Two-column layout with featured property showcase
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
    <div className='flex h-screen overflow-hidden'>
      {/* Left Column - Login Form */}
      <div className='flex w-full flex-col lg:w-1/2 overflow-y-auto'>
        {/* Logo */}
        <div className='px-6 pt-4 pb-4 lg:px-8 lg:pt-5'>
          <Link href='/buy' className='flex items-center gap-2'>
            <RealVistaLogo />
            <span className='text-xl font-bold '>RealVista</span>
          </Link>
        </div>
        <div className='border-b border-border' />

        {/* Form Container */}
        <div className='flex flex-1 items-center justify-center px-6 pb-6 lg:px-8'>
          <div className='w-full max-w-md space-y-6'>
            {/* Header */}
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                {t('welcomeBack')}
              </h1>
              <p className='mt-1.5 text-sm text-muted-foreground'>{t('welcomeBackSubtitle')}</p>
            </div>

            {/* Email/Password Form */}
            <div className='space-y-5'>
              <Suspense>
                <LoginFormNextAuth />

                {/* Visual Separator */}
                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <span className='w-full border-t border-border' />
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='bg-white px-4 text-muted-foreground'>{t('continueWith')}</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <GoogleLoginButton />
              </Suspense>
            </div>

            {/* Footer Links */}
            <div className='text-center text-sm text-muted-foreground'>
              {t('noAccount')}{' '}
              <Link
                href='/register'
                className='font-semibold text-foreground hover:text-primary transition-colors'
              >
                {t('signUpForFree')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Featured Property */}
      <div className='hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-primary/5 lg:via-primary/5 lg:to-primary/20 lg:p-8 overflow-y-auto'>
        <div className='relative mx-auto w-full max-w-sm'>
          {/* Decorative Shape */}
          <div className='absolute -right-8 -top-8 h-48 w-48 rounded-full bg-primary opacity-10' />

          {/* Property Card */}
          <PropertyCardFeatured
            title={t('cardPropertyTitle')}
            address={t('cardPropertyAddress')}
            price={locale === 'vi' ? 2600000 : 2700}
            currency={locale === 'vi' ? 'đ' : '$'}
            currencyAfter={locale === 'vi'}
            numberLocale={locale === 'vi' ? 'vi-VN' : 'en-US'}
            beds={4}
            bathrooms={2}
            area={67.5}
            imageUrl='https://voca-land.sgp1.cdn.digitaloceanspaces.com/0/1757652387243/8ce8eef2.jpg'
            badge={t('popular')}
            bedsLabel={t('beds')}
            bathroomsLabel={t('bathrooms')}
            rentSaleLabel={t('rentSale')}
            applyLabel={t('applyNow')}
            period={t('perMonth')}
            className='relative z-10 shadow-lg'
          />

          {/* Footer */}
          <div className='relative z-10 mt-6 text-center'>
            <p className='text-xs leading-relaxed text-muted-foreground'>
              {t.rich('footerDisclaimer', {
                termsOfUse: (chunks) => (
                  <Link href='/terms' className='underline hover:text-foreground/80'>
                    {chunks}
                  </Link>
                ),
                privacyPolicy: (chunks) => (
                  <Link href='/privacy' className='underline hover:text-foreground/80'>
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
