import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: {
      // Shared segments
      ...(await import(`@/shared/segments/common/${locale}.json`)).default,
      // UI components
      ...(await import(`@/shared/ui/profile-dropdown/i18n/${locale}.json`)).default,
      ...(await import(`@/shared/ui/login-required-modal/i18n/${locale}.json`)).default,
      // Feature segments
      ...(await import(`@/features/home/i18n/${locale}.json`)).default,
      ...(await import(`@/features/auth/i18n/${locale}.json`)).default,
      ...(await import(`@/features/listing-status/i18n/${locale}.json`)).default,
      ...(await import(`@/features/price-and-tour/i18n/${locale}.json`)).default,
      ...(await import(`@/features/property-about/i18n/${locale}.json`)).default,
      ...(await import(`@/features/property-gallery/i18n/${locale}.json`)).default,
      ...(await import(`@/features/property-header/i18n/${locale}.json`)).default,
      ...(await import(`@/features/rent-price-history/i18n/${locale}.json`)).default,
      ...(await import(`@/features/rental-features/i18n/${locale}.json`)).default,
      // Screen segments
      ...(await import(`@/screens/favorited/i18n/${locale}.json`)).default,
      ...(await import(`@/screens/dashboard/managed-listings/i18n/${locale}.json`)).default,
      ...(await import(`@/features/monthly-cost-breakdown/i18n/${locale}.json`)).default,
      ...(await import(`@/features/listing/i18n/${locale}.json`)).default,
      ...(await import(`@/features/listing-analytics/i18n/${locale}.json`)).default,
      ...(await import(`@/features/property-search/i18n/${locale}.json`)).default,
      // Widget segments
      ...(await import(`@/widgets/recommended-listings/i18n/${locale}.json`)).default,
    },
  };
});
