'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getPostHogClient, posthog } from './posthog';
import { PostHogPageview } from './posthog-pageview';

/**
 * PostHog Analytics Provider
 *
 * Responsibilities:
 * 1. Initializes PostHog client on mount
 * 2. Identifies authenticated users with their user_id
 * 3. Resets PostHog identity on logout
 * 4. Initializes behavior event queue for BE API batching
 * 5. Renders PostHogPageview for SPA pageview tracking
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Initialize PostHog + behavior event queue on mount
  useEffect(() => {
    getPostHogClient();
  }, []);

  // Identify/reset user when auth state changes
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user) {
      const user = session.user as { id?: string; email?: string | null; name?: string | null };
      if (user.id) {
        posthog.identify(user.id, {
          email: user.email ?? undefined,
          name: user.name ?? undefined,
        });
      }
    } else if (status === 'unauthenticated') {
      posthog.reset();
    }
  }, [session, status]);

  return (
    <>
      <PostHogPageview />
      {children}
    </>
  );
}
