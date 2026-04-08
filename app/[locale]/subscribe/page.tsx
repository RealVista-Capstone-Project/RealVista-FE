import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SubscribePage } from '@/screens/subscribe';

export default function SubscribeRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <SubscribePage />;
}
