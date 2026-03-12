'use client';

import { usePostHogRecommendationSync } from './use-posthog-recommendation-sync';

/**
 * PostHog Recommendation Sync Provider
 *
 * Must be placed in your app layout to enable automatic syncing of PostHog events
 * to the backend recommendation API.
 *
 * This component listens to PostHog events and automatically batches them
 * for backend ingestion.
 *
 * @example
 * ```tsx
 * // In your root layout (app/[locale]/layout.tsx)
 * import { PostHogRecommendationSync } from '@/features/recommendation';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <PostHogProvider>
 *       <PostHogRecommendationSync />
 *       {children}
 *     </PostHogProvider>
 *   );
 * }
 * ```
 */
export function PostHogRecommendationSync() {
  usePostHogRecommendationSync();
  return null;
}
