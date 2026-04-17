import { getLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/shared/ui/button';
import { Link } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';

export default async function NotFoundPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold'>404</h1>
        <p className='mt-2 text-2xl font-semibold'>{t('title')}</p>
        <p className='mt-4 text-lg text-muted-foreground'>{t('description')}</p>
        <div className='mt-8 flex gap-4 justify-center'>
          <Button asChild>
            <Link href={ROUTES.buy}>{t('backToHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
