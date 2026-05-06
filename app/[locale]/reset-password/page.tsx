import { Suspense } from 'react';
import { auth } from '@/shared/lib/auth/config';
import { redirect, Link } from '@/shared/config/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import RealVistaLogo from '@/shared/assets/logo/logo';
import { ResetPasswordPageClient } from '@/features/auth/ui/reset-password-page-client';

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session) {
    redirect({ href: '/', locale });
  }

  const t = await getTranslations('Auth');

  return (
    <div className='flex min-h-screen flex-col overflow-y-auto'>
      <div className='px-6 pt-4 pb-4 lg:px-8 lg:pt-5'>
        <Link href='/buy' className='flex items-center gap-2'>
          <RealVistaLogo />
          <span className='text-xl font-bold text-foreground'>RealVista</span>
        </Link>
      </div>
      <div className='border-b border-border' />

      <div className='flex flex-1 items-center justify-center px-6 py-10 lg:px-8'>
        <div className='w-full max-w-md space-y-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-foreground'>{t('resetPasswordTitle')}</h1>
            <p className='mt-1.5 text-sm text-muted-foreground'>{t('resetPasswordSubtitle')}</p>
          </div>

          <Suspense fallback={<p className='text-sm text-muted-foreground'>{t('resetPasswordSubmitting')}</p>}>
            <ResetPasswordPageClient />
          </Suspense>

          <div className='text-center text-sm text-muted-foreground'>
            <Link href='/login' className='font-semibold text-primary hover:underline'>
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
