import { setRequestLocale } from 'next-intl/server';
import PropertyDashboardPage from '@/screens/dashboard/property';

interface Props {
  params: {
    locale: string;
  };
}

export default function Page({ params: { locale } }: Props) {
  setRequestLocale(locale);
  return <PropertyDashboardPage />;
}
