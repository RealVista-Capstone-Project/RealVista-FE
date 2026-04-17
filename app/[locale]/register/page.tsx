import { auth } from '@/shared/lib/auth/config';
import { redirect } from '@/shared/config/i18n/navigation';
import { RegisterPageClient } from '@/features/auth/ui/register-page-client';
import { GoogleLoginButton } from '@/features/auth/ui/google-login-button';
import { Link } from '@/shared/config/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PropertyCardFeatured } from '@/shared/ui/property-card-featured';
import RealVistaLogo from '@/shared/assets/logo/logo';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session) {
    redirect({ href: '/', locale });
  }

  const t = await getTranslations('Auth');
  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Left Column - Register Form */}
      <div className='flex w-full flex-col lg:w-1/2 overflow-y-auto'>
        {/* Logo */}
        <div className='px-6 pt-4 pb-4 lg:px-8 lg:pt-5'>
          <Link href='/buy' className='flex items-center gap-2'>
            <RealVistaLogo />
            <span className='text-xl font-bold text-main-black'>RealVista</span>
          </Link>
        </div>
        <div className='border-b border-grey-200' />

        {/* Form Container */}
        <div className='flex flex-1 items-center justify-center px-6 pb-6 lg:px-8'>
          <div className='w-full max-w-md space-y-6'>
            {/* Register Form + role switch in header */}
            <div className='space-y-5'>
              <RegisterPageClient />

              {/* Visual Separator */}
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t border-grey-200' />
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='bg-white px-4 text-grey-500'>{t('continueWith')}</span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <GoogleLoginButton />
            </div>

            {/* Footer Links */}
            <div className='text-center text-sm text-grey-600'>
              {t('hasAccount')}{' '}
              <Link
                href='/login'
                className='font-semibold text-main-black hover:text-main-primary transition-colors'
              >
                {t('login')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Featured Property */}
      <div className='hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-purple-98 lg:via-purple-96 lg:to-purple-92 lg:p-8 overflow-y-auto'>
        <div className='relative mx-auto w-full max-w-sm'>
          {/* Decorative Shape */}
          <div className='absolute -right-8 -top-8 h-48 w-48 rounded-full bg-main-primary opacity-10' />

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
            <p className='text-xs leading-relaxed text-grey-500'>
              {t.rich('footerDisclaimer', {
                termsOfUse: (chunks) => (
                  <Link href='/terms' className='underline hover:text-grey-700'>
                    {chunks}
                  </Link>
                ),
                privacyPolicy: (chunks) => (
                  <Link href='/privacy' className='underline hover:text-grey-700'>
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
