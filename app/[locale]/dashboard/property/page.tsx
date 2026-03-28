import { setRequestLocale } from 'next-intl/server';
import PropertyDashboardPage from '@/screens/dashboard/property';

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PropertyDashboardPage />;
}
