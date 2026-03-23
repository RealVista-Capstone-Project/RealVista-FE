import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/shared/config/i18n/navigation';
import { use } from 'react';
import { ROUTES } from '@/shared/config/routes';

export default function UnauthorizedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('unauthorized');

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold'>{t('title')}</h1>
        <p className='mt-4 text-lg text-muted-foreground'>{t('description')}</p>
        <div className='mt-8 flex gap-4 justify-center'>
          <Button asChild>
            <Link href={ROUTES.login}>{t('login')}</Link>
          </Button>
          <Button variant='outline' asChild>
            <Link href={ROUTES.buy}>{t('backToHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
