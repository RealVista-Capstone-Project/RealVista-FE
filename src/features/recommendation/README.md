# Recommendation Feature

AI-powered personalized listing recommendations using behavioral tracking and machine learning.

## Architecture

This feature follows **Feature-Sliced Design (FSD)** methodology:

- **Entities Layer** (`src/entities/recommendation/`): API client, query factory, types
- **Features Layer** (`src/features/recommendation/`): React hooks and business logic

## API Endpoints

### 1. Ingest User Behavior
**POST** `/api/v1/recommendations/behavior`

Tracks user interactions with listings (views, clicks, bookmarks, etc.)

### 2. Get Recommendations
**GET** `/api/v1/recommendations?limit=10`

Retrieves AI-powered personalized recommendations for the authenticated user.

### 3. Refresh Recommendations
**POST** `/api/v1/recommendations/refresh?limit=10`

Forces fresh recommendation generation, bypassing cache.

### 4. Get Status
**GET** `/api/v1/recommendations/status`

Returns event count and threshold status for the current user.

## Usage

### Tracking User Behavior

Use the `useTrackBehavior` hook to track user interactions:

```typescript
import { useTrackBehavior } from '@/features/recommendation';

function ListingDetail({ listingId }: { listingId: string }) {
  const { track, flush } = useTrackBehavior();

  useEffect(() => {
    // Track listing view
    track('VIEW', listingId, {
      durationSeconds: 120,
      metadata: { source: 'homepage' }
    });

    // Flush events on unmount
    return () => flush();
  }, [listingId, track, flush]);

  const handleBookmark = () => {
    track('BOOKMARK', listingId);
  };

  return (
    <div>
      <button onClick={handleBookmark}>Bookmark</button>
    </div>
  );
}
```

### Displaying Recommendations

Use the `useRecommendations` hook to fetch and display recommendations:

```typescript
import { useRecommendations } from '@/features/recommendation';

function RecommendedListings() {
  const { data, isLoading, error } = useRecommendations(10);

  if (isLoading) return <div>Loading recommendations...</div>;
  if (error) return <div>Failed to load recommendations</div>;

  return (
    <div>
      <h2>Recommended for You</h2>
      {data?.data.recommendations.map((listing) => (
        <div key={listing.listing_id}>
          <h3>{listing.name}</h3>
          <p>{listing.reason}</p>
          <p>Score: {listing.score.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
```

### Refresh Recommendations

Use the `useRefreshRecommendations` hook to force-generate new recommendations:

```typescript
import { useRefreshRecommendations } from '@/features/recommendation';

function RefreshButton() {
  const { mutate, isPending } = useRefreshRecommendations();

  return (
    <button
      onClick={() => mutate(10)}
      disabled={isPending}
    >
      {isPending ? 'Refreshing...' : 'Get New Recommendations'}
    </button>
  );
}
```

### Check Recommendation Status

Use the `useRecommendationStatus` hook to check if enough data has been collected:

```typescript
import { useRecommendationStatus } from '@/features/recommendation';

function RecommendationStatus() {
  const { data } = useRecommendationStatus();

  if (!data) return null;

  return (
    <div>
      <p>Events tracked: {data.data.event_count}</p>
      <p>Ready for recommendations: {data.data.threshold_met ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Behavior Event Types

- **VIEW**: User viewed a listing
- **CLICK**: User clicked on a listing
- **BOOKMARK**: User bookmarked/saved a listing
- **SEARCH**: User searched for listings
- **INQUIRY**: User sent an inquiry about a listing
- **SHARE**: User shared a listing

## Event Batching

The `useTrackBehavior` hook automatically batches events to reduce API calls:
- Events are buffered and sent in batches
- Automatically flushes after 5 seconds or when 10 events are collected
- Call `flush()` manually to send events immediately (e.g., on page navigation)

## Type Safety

All API requests and responses are fully typed:

```typescript
import type {
  BehaviorEvent,
  BehaviorEventType,
  RecommendedListing,
  RecommendationResponse,
} from '@/entities/recommendation';
```

## Error Handling

The hooks use TanStack Query, which provides built-in error handling:

```typescript
const { data, error, isError } = useRecommendations();

if (isError) {
  console.error('Failed to fetch recommendations:', error);
}
```

## Cache Management

- Recommendations are cached for 10 minutes
- Status is cached for 1 minute
- Cache is automatically invalidated after behavior ingestion or refresh
- Use `queryClient.invalidateQueries()` to manually invalidate cache

## Integration Example

Complete example showing tracking and recommendations together:

```typescript
'use client';

import { useEffect } from 'react';
import {
  useTrackBehavior,
  useRecommendations,
  useRecommendationStatus,
} from '@/features/recommendation';

export function SmartRecommendations({ currentListingId }: { currentListingId: string }) {
  const { track, flush } = useTrackBehavior();
  const { data: recommendations } = useRecommendations(5);
  const { data: status } = useRecommendationStatus();

  useEffect(() => {
    // Track view
    const startTime = Date.now();
    track('VIEW', currentListingId, {
      metadata: { source: 'detail_page' }
    });

    return () => {
      // Track duration on unmount
      const duration = Math.floor((Date.now() - startTime) / 1000);
      track('VIEW', currentListingId, {
        durationSeconds: duration,
      });
      flush();
    };
  }, [currentListingId, track, flush]);

  if (!status?.data.threshold_met) {
    return <p>Keep browsing to get personalized recommendations!</p>;
  }

  return (
    <div>
      <h2>Recommended for You</h2>
      {recommendations?.data.recommendations.map((listing) => (
        <ListingCard
          key={listing.listing_id}
          listing={listing}
          onView={() => track('VIEW', listing.listing_id)}
        />
      ))}
    </div>
  );
}
```
