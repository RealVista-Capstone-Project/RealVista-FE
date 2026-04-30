import { setRequestLocale } from 'next-intl/server';
import { AdminPropertyEditPage } from '@/screens/admin/manage-properties';

interface Props {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <AdminPropertyEditPage propertyId={id} />;
}
