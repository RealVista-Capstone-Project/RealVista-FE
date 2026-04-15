import { getTranslations } from 'next-intl/server';
import { AppointmentsPage } from '@/features/appointments/components/appointments-page';

export async function generateMetadata({
  params: { locale },
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations(locale);
  return {
    title: t('appointments.title'),
  };
}

export default async function AppointmentsPageRoute() {
  return <AppointmentsPage />;
}