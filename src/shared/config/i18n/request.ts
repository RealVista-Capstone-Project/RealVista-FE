import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { mergeRecordDeep } from './merge-messages';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // Helper to merge English fallback with local translations.
  // We pass the imports explicitly so Webpack can statically analyze them.
  const load = async (en: Promise<any>, local: Promise<any>) => {
    const enMessages = (await en).default;
    if (locale === 'en') return enMessages;
    const localMessages = (await local).default;
    return mergeRecordDeep(enMessages, localMessages);
  };

  return {
    locale,
    messages: {
      ...(await load(
        import('@/shared/segments/common/en.json'),
        import(`@/shared/segments/common/${locale}.json`)
      )),
      ...(await load(
        import('@/shared/ui/data-table/i18n/en.json'),
        import(`@/shared/ui/data-table/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/shared/ui/profile-dropdown/i18n/en.json'),
        import(`@/shared/ui/profile-dropdown/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/shared/ui/login-required-modal/i18n/en.json'),
        import(`@/shared/ui/login-required-modal/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/shared/ui/property-map/i18n/en.json'),
        import(`@/shared/ui/property-map/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/home/i18n/en.json'),
        import(`@/features/home/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/auth/i18n/en.json'),
        import(`@/features/auth/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/listing-status/i18n/en.json'),
        import(`@/features/listing-status/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/price-and-tour/i18n/en.json'),
        import(`@/features/price-and-tour/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/appointments/i18n/en.json'),
        import(`@/features/appointments/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/property-about/i18n/en.json'),
        import(`@/features/property-about/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/property-gallery/i18n/en.json'),
        import(`@/features/property-gallery/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/property-header/i18n/en.json'),
        import(`@/features/property-header/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/rent-price-history/i18n/en.json'),
        import(`@/features/rent-price-history/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/rental-features/i18n/en.json'),
        import(`@/features/rental-features/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/agent-engagement/i18n/en.json'),
        import(`@/features/agent-engagement/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/rental-contract/i18n/en.json'),
        import(`@/features/rental-contract/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/crm/i18n/en.json'),
        import(`@/features/crm/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/listing-detail/i18n/en.json'),
        import(`@/screens/listing-detail/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/listing-report/i18n/en.json'),
        import(`@/features/listing-report/i18n/${locale}.json`)
      )),
      // Screen segments
      ...(await load(
        import('@/screens/dashboard/i18n/en.json'),
        import(`@/screens/dashboard/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/dashboard/property/i18n/en.json'),
        import(`@/screens/dashboard/property/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/dashboard/property-3d-management/i18n/en.json'),
        import(`@/screens/dashboard/property-3d-management/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/favorited/i18n/en.json'),
        import(`@/screens/favorited/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/compare/i18n/en.json'),
        import(`@/screens/compare/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/manage-agent/i18n/en.json'),
        import(`@/screens/manage-agent/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/subscribe/i18n/en.json'),
        import(`@/screens/subscribe/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/manage-rental-contract/i18n/en.json'),
        import(`@/screens/manage-rental-contract/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/create-rental-contract/i18n/en.json'),
        import(`@/screens/create-rental-contract/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/lease-signing-complete/i18n/en.json'),
        import(`@/screens/lease-signing-complete/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/my-rental-contracts/i18n/en.json'),
        import(`@/screens/my-rental-contracts/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/property-feed/i18n/en.json'),
        import(`@/screens/property-feed/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/dashboard/managed-listings/i18n/en.json'),
        import(`@/screens/dashboard/managed-listings/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/dashboard/messages/i18n/en.json'),
        import(`@/screens/dashboard/messages/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/admin/manage-users/i18n/en.json'),
        import(`@/screens/admin/manage-users/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/admin/manage-locations/i18n/en.json'),
        import(`@/screens/admin/manage-locations/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/admin/manage-packages/i18n/en.json'),
        import(`@/screens/admin/manage-packages/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/admin/manage-policy/i18n/en.json'),
        import(`@/screens/admin/manage-policy/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/admin/manage-reports/i18n/en.json'),
        import(`@/screens/admin/manage-reports/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/admin/manage-templates/i18n/en.json'),
        import(`@/screens/admin/manage-templates/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/admin/manage-properties/i18n/en.json'),
        import(`@/screens/admin/manage-properties/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/dashboard/delegate-agent/i18n/en.json'),
        import(`@/screens/dashboard/delegate-agent/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/monthly-cost-breakdown/i18n/en.json'),
        import(`@/features/monthly-cost-breakdown/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/rent-vs-buy/i18n/en.json'),
        import(`@/features/rent-vs-buy/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/listing/i18n/en.json'),
        import(`@/features/listing/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/listing-analytics/i18n/en.json'),
        import(`@/features/listing-analytics/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/property-search/i18n/en.json'),
        import(`@/features/property-search/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/engagement/i18n/en.json'),
        import(`@/features/engagement/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/buy/i18n/en.json'),
        import(`@/screens/buy/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/rent/i18n/en.json'),
        import(`@/screens/rent/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/screens/sell/i18n/en.json'),
        import(`@/screens/sell/i18n/${locale}.json`)
      )),
      // Widget segments
      ...(await load(
        import('@/widgets/recommended-listings/i18n/en.json'),
        import(`@/widgets/recommended-listings/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/widgets/ai-chat-assistant/i18n/en.json'),
        import(`@/widgets/ai-chat-assistant/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/widgets/spark-viewer/i18n/en.json'),
        import(`@/widgets/spark-viewer/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/widgets/notification-dropdown/i18n/en.json'),
        import(`@/widgets/notification-dropdown/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/widgets/billing/i18n/en.json'),
        import(`@/widgets/billing/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/widgets/owner-dashboard/i18n/en.json'),
        import(`@/widgets/owner-dashboard/i18n/${locale}.json`)
      )),
      ...(await load(
        import('@/features/chat/i18n/en.json'),
        import(`@/features/chat/i18n/${locale}.json`)
      )),
    },
  };
});
