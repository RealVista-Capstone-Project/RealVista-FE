import { auth } from '@/shared/lib/auth/config';
import { redirect } from '@/shared/config/i18n/navigation';
import { RegisterPageClient } from '@/features/auth/ui/register-page-client';
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
          <Link href='/buy' className='flex items-center gap-1'>
            <RealVistaLogo />
            <span className='text-xl font-bold text-foreground'>RealVista</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className='flex flex-1 items-center justify-center px-6 pb-6 lg:px-8'>
          <div className='w-full max-w-md space-y-6'>
            {/* Register Form + role-aware social auth */}
            <RegisterPageClient />

            {/* Footer Links */}
            <div className='text-center text-sm text-muted-foreground'>
              {t('hasAccount')}{' '}
              <Link
                href='/login'
                className='font-semibold text-foreground hover:text-primary transition-colors'
              >
                {t('login')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Featured Property */}
      <div className='hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-primary/10 lg:via-primary/5 lg:to-primary/30 lg:p-8 overflow-y-auto relative'>
        {/* Decorative gradient overlay for depth */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0%,_transparent_50%)] opacity-10 pointer-events-none' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--primary)_0%,_transparent_40%)] opacity-5 pointer-events-none' />
        <div className='relative mx-auto w-full max-w-sm'>
          {/* Decorative Shapes - spread out beyond card area */}
          <div className='absolute -right-20 -top-16 h-56 w-56 rounded-full bg-primary opacity-10' />
          <div className='absolute -left-24 top-1/4 h-40 w-40 rounded-full bg-primary opacity-5' />
          <div className='absolute right-4 bottom-32 h-32 w-32 rounded-full bg-primary opacity-8' />
          <div className='absolute -left-16 bottom-8 h-24 w-24 rounded-full bg-primary opacity-6' />
          <div className='absolute right-1/4 -top-12 h-20 w-20 rounded-full bg-primary opacity-7' />

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
