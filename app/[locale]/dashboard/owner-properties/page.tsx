import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OwnerPropertiesPage } from '@/screens/owner-properties';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const tLayout = await getTranslations('DashboardLayout');
  const tPage = await getTranslations('OwnerProperties');

  const title = tLayout('pageTitle.ownerProperties');

  return {
    title: `${title} | RealVista`,
    description: tPage('pageSubtitle'),
  };
}

export default function OwnerPropertiesRoute() {
  return <OwnerPropertiesPage />;
}
