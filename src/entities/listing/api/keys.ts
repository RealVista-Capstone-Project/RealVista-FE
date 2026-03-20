/**
 * Listing Query Keys
 * Centralized query keys for TanStack Query
 * Provides type-safe query keys for invalidation and caching
 */
export const listingKeys = {
  // Base key for all listing queries
  all: ['listings'] as const,

  // All listing lists (with optional filters)
  lists: () => [...listingKeys.all, 'list'] as const,
  list: (filters: string) => [...listingKeys.lists(), filters] as const,

  // Single listing queries
  detail: (id: string) => [...listingKeys.all, 'detail', id] as const,

  // Price history for a listing
  priceHistory: (id: string) => [...listingKeys.all, 'price-history', id] as const,

  // Similar listings queries
  similar: (id: string, limit: number) => [...listingKeys.all, 'similar', id, limit] as const,

  // Managed listings (user's own listings)
  managed: () => [...listingKeys.all, 'managed'] as const,
} as const;
