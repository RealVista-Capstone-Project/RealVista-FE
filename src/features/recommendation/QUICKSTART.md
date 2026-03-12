# Quick Start Guide: AI Recommendations

## 1. Import the Hooks

```typescript
import {
  useTrackBehavior,
  useRecommendations,
  useRecommendationStatus,
  useRefreshRecommendations,
} from '@/features/recommendation';
```

## 2. Track User Behavior (Required)

Add to any listing page to start collecting user behavior data:

```typescript
'use client';

import { useEffect } from 'react';
import { useTrackBehavior } from '@/features/recommendation';

export function ListingPage({ listingId }: { listingId: string }) {
  const { track, flush } = useTrackBehavior();

  useEffect(() => {
    // Track view when component mounts
    track('VIEW', listingId);

    // Flush events when component unmounts
    return () => flush();
  }, [listingId, track, flush]);

  return (
    <div>
      {/* Your listing content */}
      <button onClick={() => track('BOOKMARK', listingId)}>
        Bookmark
      </button>
    </div>
  );
}
```

## 3. Display Recommendations

Once users have browsed enough listings, show personalized recommendations:

```typescript
'use client';

import { useRecommendations } from '@/features/recommendation';

export function RecommendationsSection() {
  const { data, isLoading } = useRecommendations(6);

  if (isLoading) return <div>Loading...</div>;

  return (
    <section>
      <h2>Recommended for You</h2>
      <div className='grid grid-cols-3 gap-4'>
        {data?.data.recommendations.map((listing) => (
          <div key={listing.listing_id}>
            <img src={listing.thumbnail} alt={listing.name} />
            <h3>{listing.name}</h3>
            <p>{listing.reason}</p>
            <p>${listing.price.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

## 4. Check Status (Optional)

Show users their progress toward getting recommendations:

```typescript
import { useRecommendationStatus } from '@/features/recommendation';

export function StatusBadge() {
  const { data } = useRecommendationStatus();

  if (!data?.data.threshold_met) {
    return (
      <div className='rounded bg-blue-50 p-2 text-sm'>
        Browse {10 - (data?.data.event_count || 0)} more listings to unlock recommendations!
      </div>
    );
  }

  return null;
}
```

## 5. Refresh Button (Optional)

Let users manually refresh their recommendations:

```typescript
import { useRefreshRecommendations } from '@/features/recommendation';

export function RefreshButton() {
  const { mutate, isPending } = useRefreshRecommendations();

  return (
    <button onClick={() => mutate(6)} disabled={isPending}>
      {isPending ? 'Refreshing...' : 'Get New Recommendations'}
    </button>
  );
}
```

## Complete Example

Here's a complete page combining tracking and display:

```typescript
'use client';

import { useEffect } from 'react';
import {
  useTrackBehavior,
  useRecommendations,
  useRecommendationStatus,
} from '@/features/recommendation';

export function HomePage() {
  const { track } = useTrackBehavior();
  const { data: recommendations } = useRecommendations(6);
  const { data: status } = useRecommendationStatus();

  // Track page view
  useEffect(() => {
    track('SEARCH', 'homepage', {
      metadata: { source: 'homepage' }
    });
  }, [track]);

  return (
    <div>
      {/* Show status if not ready */}
      {!status?.data.threshold_met && (
        <div className='mb-4 rounded bg-blue-50 p-4'>
          Keep browsing to get personalized recommendations!
          ({status?.data.event_count || 0} interactions tracked)
        </div>
      )}

      {/* Show recommendations if ready */}
      {status?.data.threshold_met && (
        <section className='mb-8'>
          <h2 className='mb-4 text-2xl font-bold'>Recommended for You</h2>
          <div className='grid grid-cols-3 gap-6'>
            {recommendations?.data.recommendations.map((listing) => (
              <div
                key={listing.listing_id}
                onClick={() => track('CLICK', listing.listing_id)}
                className='cursor-pointer rounded-lg border p-4 hover:shadow-lg'
              >
                <img
                  src={listing.thumbnail}
                  alt={listing.name}
                  className='mb-2 h-40 w-full rounded object-cover'
                />
                <h3 className='font-semibold'>{listing.name}</h3>
                <p className='text-sm text-gray-600'>{listing.location}</p>
                <p className='mt-2 text-lg font-bold'>
                  ${listing.price.toLocaleString()}
                </p>
                <p className='mt-2 text-xs italic text-gray-500'>
                  {listing.reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

## Event Types Reference

- **VIEW**: Track when user views a listing
- **CLICK**: Track when user clicks on a listing card
- **BOOKMARK**: Track when user saves/bookmarks
- **SEARCH**: Track search actions
- **INQUIRY**: Track when user sends inquiry
- **SHARE**: Track when user shares a listing

## Tips

1. **Always flush on unmount** to ensure events are sent before navigation
2. **Events are batched** - they're sent every 5 seconds or when 10 events accumulate
3. **Threshold is automatic** - backend determines when enough data is collected
4. **Cache is smart** - recommendations are cached for 10 minutes
5. **Track meaningful actions** - focus on VIEW, CLICK, and BOOKMARK events

For more details, see:
- `src/features/recommendation/README.md` - Complete documentation
- `src/features/recommendation/examples/usage-examples.tsx` - Detailed examples
