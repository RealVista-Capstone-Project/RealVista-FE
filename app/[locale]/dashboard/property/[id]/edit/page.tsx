import { setRequestLocale } from 'next-intl/server';
import PropertyEditPage from '@/screens/dashboard/property-edit';

interface Props {
  params: Promise<{
    locale: string;
    id: string; // The property ID to be edited
  }>;
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);
  return <PropertyEditPage id={resolvedParams.id} />;
}
