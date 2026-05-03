'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/shared/config/i18n/navigation';
import { ResetPasswordForm } from '@/features/auth/ui/reset-password-form';

export function ResetPasswordPageClient() {
  const t = useTranslations('Auth');
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  if (!token) {
    return (
      <div className='space-y-4 text-center'>
        <p className='text-sm text-muted-foreground'>{t('resetTokenMissing')}</p>
        <Link href='/forgot-password' className='text-sm font-semibold text-primary hover:underline'>
          {t('requestNewResetLink')}
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
