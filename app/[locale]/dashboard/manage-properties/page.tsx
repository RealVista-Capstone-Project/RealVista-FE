import { setRequestLocale } from 'next-intl/server';
import { AdminManagePropertiesPage } from '@/screens/admin/manage-properties';

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminManagePropertiesPage />;
}
