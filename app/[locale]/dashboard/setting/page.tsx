import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SettingsPage } from '@/widgets/settings/ui/settings-page';

export default async function AgentDashboardSettingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense>
      <SettingsPage variant='agentDashboard' />
    </Suspense>
  );
}
