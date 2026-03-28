'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { bookmarkApi } from '@/entities/bookmark';
import { useAuthSession } from '@/features/auth/model';
import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type { Listing } from '@/entities/listing';
import { behaviorTracker } from '@/shared/lib/analytics';

/**
 * Manages the favorite (bookmark) state for a single listing.
 *
 * The server component fetches listing data without an auth token
 * (getAuthTokenSync() is null on SSR, and AuthTokenProvider's useEffect
 * populates the cache after child effects run). This hook re-fetches
 * is_favorite client-side by passing the token directly from the session,
 * bypassing the sync cache entirely.
 */
export function useListingFavorite(listingId: string, initialFavorite: boolean) {
  const { data: session } = useAuthSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  const [isFavorite, setIsFavorite] = useState<boolean>(initialFavorite);

  useEffect(() => {
    if (!accessToken) return;
    http
      .get<ApiResponse<Listing>>(`/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        const val = res.payload?.data?.is_favorite;
        if (val !== undefined) setIsFavorite(val);
      });
  }, [accessToken, listingId]);

  const { mutate: toggleFavorite } = useMutation({
    mutationFn: () => bookmarkApi.toggleBookmark(listingId),
    onMutate: () => {
      const willBeFavorite = !isFavorite;
      setIsFavorite(willBeFavorite);
      behaviorTracker.trackBookmark(listingId, willBeFavorite ? 'add' : 'remove');
    },
    onError: () => setIsFavorite((prev) => !prev),
  });

  return { isFavorite, toggleFavorite };
}
