'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { env } from '@/shared/lib/env/env';

/**
 * PostHogPageView Component
 *
 * Tracks page views in the Next.js App Router.
 * Since App Router navigations don't trigger full page loads,
 * we need to manually capture pageviews on route changes.
 *
 * Wrapped in Suspense because useSearchParams() needs it.
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthogClient.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

/**
 * SuspendedPostHogPageView
 *
 * Wraps PostHogPageView in Suspense as required by useSearchParams().
 */
function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}

/**
 * PostHogProvider Component
 *
 * Initializes the PostHog client and provides it to the app via context.
 * Includes automatic pageview tracking for Next.js App Router navigations.
 *
 * @example
 * ```tsx
 * import { PostHogProvider } from '@/shared/providers/posthog-provider';
 *
 * export default function Layout({ children }) {
 *   return <PostHogProvider>{children}</PostHogProvider>;
 * }
 * ```
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false, // We capture pageviews manually via PostHogPageView
      capture_pageleave: true,
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}
