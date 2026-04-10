import { Suspense } from 'react';
import { SettingsPage } from '@/widgets/settings/ui/settings-page';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';

export default function SettingsPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  );
}
