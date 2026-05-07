import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PropertyFeedPage } from '@/screens/property-feed';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const tLayout = await getTranslations('DashboardLayout');
  const tPage = await getTranslations('PropertyFeed');

  const title = tLayout('pageTitle.propertyFeed');

  return {
    title: `${title} | RealVista`,
    description: tPage('pageb'),
  };
}

export default function PropertyFeedRoute() {
  return <PropertyFeedPage />;
}
