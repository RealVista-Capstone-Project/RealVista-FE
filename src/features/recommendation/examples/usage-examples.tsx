'use client';

import { useEffect, useState } from 'react';
import {
  useTrackBehavior,
  useRecommendations,
  useRecommendationStatus,
  useRefreshRecommendations,
} from '@/features/recommendation';
import type { RecommendedListing } from '@/entities/recommendation';

/**
 * Example: Listing Detail Page with Behavior Tracking
 */
export function ListingDetailExample({ listingId }: { listingId: string }) {
  const { track, flush } = useTrackBehavior();
  const [viewStartTime] = useState(() => Date.now());

  useEffect(() => {
    // Track initial view
    track('VIEW', listingId, {
      metadata: {
        source: 'listing_detail',
        timestamp: new Date().toISOString(),
      },
    });

    // Track view duration on unmount
    return () => {
      const durationSeconds = Math.floor((Date.now() - viewStartTime) / 1000);
      track('VIEW', listingId, {
        durationSeconds,
        metadata: { final: true },
      });
      flush(); // Ensure events are sent before page unmount
    };
  }, [listingId, track, flush, viewStartTime]);

  const handleBookmark = () => {
    track('BOOKMARK', listingId, {
      metadata: { action: 'add' },
    });
  };

  const handleInquiry = () => {
    track('INQUIRY', listingId, {
      metadata: { type: 'contact_owner' },
    });
  };

  const handleShare = () => {
    track('SHARE', listingId, {
      metadata: { platform: 'facebook' },
    });
  };

  return (
    <div>
      <h1>Listing Details</h1>
      <button onClick={handleBookmark}>Bookmark</button>
      <button onClick={handleInquiry}>Send Inquiry</button>
      <button onClick={handleShare}>Share</button>
    </div>
  );
}

/**
 * Example: Recommendations Widget
 */
export function RecommendationsWidget() {
  const { data, isLoading, error } = useRecommendations(6);
  const { data: status } = useRecommendationStatus();
  const { mutate: refresh, isPending: isRefreshing } = useRefreshRecommendations();
  const { track } = useTrackBehavior();

  const handleListingClick = (listing: RecommendedListing) => {
    track('CLICK', listing.listing_id, {
      metadata: {
        source: 'recommendations_widget',
        score: listing.score,
        position: data?.data.recommendations.indexOf(listing),
      },
    });
  };

  if (!status?.data.threshold_met) {
    return (
      <div className='rounded-lg border p-6'>
        <h3 className='mb-2 text-lg font-semibold'>Get Personalized Recommendations</h3>
        <p className='text-sm text-gray-600'>
          Browse more listings to receive AI-powered recommendations tailored to your preferences.
        </p>
        <p className='mt-2 text-xs text-gray-500'>
          Events tracked: {status?.data.event_count || 0}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='rounded-lg border p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-4 w-3/4 rounded bg-gray-200'></div>
          <div className='h-4 w-1/2 rounded bg-gray-200'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-6'>
        <p className='text-sm text-red-600'>Failed to load recommendations</p>
        <button
          onClick={() => refresh()}
          className='mt-2 text-xs text-red-700 underline'
          disabled={isRefreshing}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className='rounded-lg border p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Recommended for You</h3>
          <p className='text-xs text-gray-500'>
            {data?.data.from_cache ? 'From cache' : 'Freshly generated'} •{' '}
            {new Date(data?.data.generated_at || '').toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => refresh(6)}
          disabled={isRefreshing}
          className='rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50'
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {data?.data.behavior_summary && (
        <p className='mb-4 text-sm text-gray-600'>{data.data.behavior_summary}</p>
      )}

      <div className='space-y-4'>
        {data?.data.recommendations.map((listing) => (
          <div
            key={listing.listing_id}
            className='cursor-pointer rounded-lg border p-4 hover:shadow-md'
            onClick={() => handleListingClick(listing)}
          >
            <div className='flex gap-4'>
              {listing.thumbnail && (
                <img
                  src={listing.thumbnail}
                  alt={listing.name}
                  className='h-20 w-20 rounded object-cover'
                />
              )}
              <div className='flex-1'>
                <h4 className='font-semibold'>{listing.name}</h4>
                <p className='text-sm text-gray-600'>{listing.location}</p>
                <p className='mt-1 text-sm font-medium'>
                  ${listing.price.toLocaleString()} • {listing.listing_type}
                </p>
                <p className='mt-2 text-xs italic text-gray-500'>&quot;{listing.reason}&quot;</p>
                <p className='text-xs text-gray-400'>
                  Relevance: {(listing.score * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Recommendation Status Badge
 */
export function RecommendationStatusBadge() {
  const { data, isLoading } = useRecommendationStatus();

  if (isLoading) return null;

  return (
    <div className='inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm'>
      <span className={data?.data.threshold_met ? 'text-green-600' : 'text-gray-600'}>
        {data?.data.threshold_met ? '✓' : '○'}
      </span>
      <span className='text-gray-700'>
        {data?.data.event_count || 0} interactions tracked
      </span>
    </div>
  );
}
