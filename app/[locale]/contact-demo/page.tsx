import { ContactDemoPage } from '@/screens/contact-demo';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';

/**
 * Contact Demo Page
 *
 * Demo page for testing Contact UI components:
 * - Contact Modal with pre-filled form
 * - Chat Dropdown with conversation list
 * - Floating Chat Windows (Facebook Messenger style)
 */
export default function ContactDemoRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return <ContactDemoPage />;
}
