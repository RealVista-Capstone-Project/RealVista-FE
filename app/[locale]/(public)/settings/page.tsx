import { Suspense } from 'react';
import { SettingsPage } from '@/widgets/settings/ui/settings-page';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { AuthGuard } from '@/shared/lib/auth/auth-guard';

export default function SettingsPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <Suspense>
        <SettingsPage />
      </Suspense>
    </AuthGuard>
  );
}
