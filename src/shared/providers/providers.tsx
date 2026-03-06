'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';
import { AuthTokenProvider } from '@/shared/lib/auth/auth-token-provider';
import { PostHogProvider } from '@/shared/providers/posthog-provider';

/**
 * App Providers Component
 *
 * Wraps the application with all necessary React providers:
 * - PostHogProvider: PostHog analytics and pageview tracking
 * - SessionProvider: NextAuth authentication state
 * - AuthTokenProvider: Synchronizes auth token with HTTP client
 * - QueryClientProvider: TanStack Query for server state management
 *
 * @example
 * ```tsx
 * import { Providers } from '@/shared/providers';
 *
 * export default function Layout({ children }) {
 *   return <Providers>{children}</Providers>;
 * }
 * ```
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance on client side to avoid SSR issues
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <PostHogProvider>
      <SessionProvider>
        <AuthTokenProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AuthTokenProvider>
      </SessionProvider>
    </PostHogProvider>
  );
}
