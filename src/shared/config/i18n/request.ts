import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: {
      ...(await import(`@/shared/segments/common/${locale}.json`)).default,
      ...(await import(`@/shared/ui/profile-dropdown/i18n/${locale}.json`)).default,
      ...(await import(`@/shared/ui/login-required-modal/i18n/${locale}.json`)).default,
      ...(await import(`@/features/home/i18n/${locale}.json`)).default,
      ...(await import(`@/features/auth/i18n/${locale}.json`)).default,
      ...(await import(`@/features/listing-status/i18n/${locale}.json`)).default,
      ...(await import(`@/features/price-and-tour/i18n/${locale}.json`)).default,
      ...(await import(`@/features/property-about/i18n/${locale}.json`)).default,
      ...(await import(`@/features/property-gallery/i18n/${locale}.json`)).default,
      ...(await import(`@/features/property-header/i18n/${locale}.json`)).default,
      ...(await import(`@/features/rent-price-history/i18n/${locale}.json`)).default,
      ...(await import(`@/features/rental-features/i18n/${locale}.json`)).default,
      ...(await import(`@/features/agent-engagement/i18n/${locale}.json`)).default,
      ...(await import(`@/features/rental-contract/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/favorited/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/manage-agent/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/subscribe/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/manage-rental-contract/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/create-rental-contract/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/lease-signing-complete/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/my-rental-contracts/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/owner-properties/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/dashboard/managed-listings/i18n/${locale}.json`)).default,
      ...(await import(`@/features/monthly-cost-breakdown/i18n/${locale}.json`)).default,
      ...(await import(`@/features/listing/i18n/${locale}.json`)).default,
      ...(await import(`@/features/listing-analytics/i18n/${locale}.json`)).default,
      ...(await import(`@/features/property-search/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/buy/i18n/${locale}.json`)).default,
      ...(await import(`@/widgets/recommended-listings/i18n/${locale}.json`)).default,
      ...(await import(`@/widgets/ai-chat-assistant/i18n/${locale}.json`)).default,
    },
  };
});
