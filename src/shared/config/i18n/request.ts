import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: {
      // Shared segments
      ...(await import(`@/shared/segments/common/${locale}.json`)).default,
      // Feature segments
      ...(await import(`@/features/home/i18n/${locale}.json`)).default,
      ...(await import(`@/features/auth/i18n/${locale}.json`)).default
    }
  }
})
