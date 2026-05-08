import { setRequestLocale } from 'next-intl/server';
import { DashboardPropertyDetailPage } from '@/screens/dashboard/property/ui/dashboard-property-detail-page';

interface Props {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <DashboardPropertyDetailPage propertyId={id} />;
}
