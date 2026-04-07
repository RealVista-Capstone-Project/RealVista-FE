import { setRequestLocale } from 'next-intl/server';
import PropertyCreatePage from '@/screens/dashboard/property-create';

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);
  return <PropertyCreatePage />;
}
