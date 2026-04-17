import { setRequestLocale } from 'next-intl/server';
import CreateListingPage from '@/screens/dashboard/create-listing';

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);
  return <CreateListingPage />;
}
