'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';
import { AuthTokenProvider } from '@/shared/lib/auth/auth-token-provider';
import { Toaster } from '@/shared/ui/sonner';
import { SubscriptionCTABanner } from '@/widgets/billing';

/**
 * App Providers Component
 *
 * Wraps the application with all necessary React providers:
 * - SessionProvider: NextAuth authentication state
 * - AuthTokenProvider: Synchronizes auth token with HTTP client
 * - QueryClientProvider: TanStack Query for server state management
 * - Toaster: Displays toast notifications across the application
 * - SubscriptionCTABanner: Renders subscription upgrade CTA for non-premium users
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
    <SessionProvider>
      <AuthTokenProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors position='top-right' />
          <SubscriptionCTABanner />
        </QueryClientProvider>
      </AuthTokenProvider>
    </SessionProvider>
  );
}
