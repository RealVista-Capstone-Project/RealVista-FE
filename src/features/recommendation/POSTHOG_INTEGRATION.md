# PostHog Integration: When Backend APIs Are Called

## 🔄 Complete Flow Diagram

```
User Action → PostHog Event → Event Buffer → Backend API Call
```

## 📊 API Call Timeline with PostHog

### 1. **Setup Phase (App Initialization)**

#### Step 1: Add Provider to Root Layout
```tsx
// app/[locale]/layout.tsx
import { PostHogProvider } from '@/shared/providers/posthog-provider';
import { PostHogRecommendationSync } from '@/features/recommendation';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PostHogProvider>
          {/* ✅ This component listens to ALL PostHog events */}
          <PostHogRecommendationSync />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
```

**What happens:**
- `PostHogRecommendationSync` starts listening to PostHog events
- It batches listing-related events automatically
- No manual API calls needed!

---

## 🎯 When Backend APIs Are Called

### API 1: `POST /api/v1/recommendations/behavior` (Ingest Behavior)

**Called Automatically** via PostHog event batching:

#### Trigger Events:

1. **User Views Listing**
```tsx
// pages/listings/[id].tsx
const { trackListing } = usePostHogTracking();

useEffect(() => {
  trackListing('VIEW', listingId);  // → PostHog event
}, [listingId]);
```
**Flow:**
```
trackListing('VIEW') 
  ↓ PostHog captures: "listing_viewed"
  ↓ PostHogRecommendationSync detects event
  ↓ Adds to buffer
  ↓ After 5 seconds OR 10 events
  ↓ Calls: POST /api/v1/recommendations/behavior
```

2. **User Clicks Listing Card**
```tsx
// components/ListingCard.tsx
const handleClick = () => {
  trackListing('CLICK', listing.id);  // → PostHog event
};
```
**Auto-batched and sent to backend!**

3. **User Bookmarks Listing**
```tsx
const handleBookmark = () => {
  trackListing('BOOKMARK', listingId);  // → PostHog event
};
```
**Auto-batched and sent to backend!**

4. **User Searches**
```tsx
const handleSearch = (query: string) => {
  trackListing('SEARCH', 'homepage', {
    metadata: { query }
  });  // → PostHog event
};
```
**Auto-batched and sent to backend!**

5. **User Sends Inquiry**
```tsx
const handleInquiry = () => {
  trackListing('INQUIRY', listingId);  // → PostHog event
};
```
**Auto-batched and sent to backend!**

6. **User Shares Listing**
```tsx
const handleShare = () => {
  trackListing('SHARE', listingId);  // → PostHog event
};
```
**Auto-batched and sent to backend!**

#### Batching Logic:
```
Events are buffered and sent when:
✅ 5 seconds pass (automatic flush)
✅ 10 events accumulated (immediate flush)
✅ User leaves page (beforeunload event)
```

---

### API 2: `GET /api/v1/recommendations/status` (Get Status)

**Called Automatically** by React Query:

```tsx
// Any component that uses the hook
const { data: status } = useRecommendationStatus();
```

**When it's called:**
- ✅ When component mounts
- ✅ When window regains focus
- ✅ After behavior ingestion (automatic invalidation)
- ✅ Every 1 minute (cache stale time)

**Example:**
```tsx
// pages/dashboard.tsx
export function Dashboard() {
  const { data: status } = useRecommendationStatus();
  
  // API called automatically on mount!
  
  return (
    <div>
      <p>Tracked: {status?.data.event_count}</p>
      <p>Ready: {status?.data.threshold_met ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

---

### API 3: `GET /api/v1/recommendations` (Get Recommendations)

**Called Automatically** by React Query:

```tsx
const { data } = useRecommendations(10);
```

**When it's called:**
- ✅ When component mounts
- ✅ When window regains focus  
- ✅ After behavior ingestion (automatic invalidation)
- ✅ Every 10 minutes (cache stale time)

**Example:**
```tsx
// pages/homepage.tsx
export function HomePage() {
  const { data: status } = useRecommendationStatus();
  const { data: recommendations } = useRecommendations(6);
  
  // Both APIs called automatically on mount!
  
  if (!status?.data.threshold_met) {
    return <p>Keep browsing!</p>;
  }
  
  return (
    <div>
      {recommendations?.data.recommendations.map(listing => (
        <ListingCard key={listing.listing_id} {...listing} />
      ))}
    </div>
  );
}
```

---

### API 4: `POST /api/v1/recommendations/refresh` (Force Refresh)

**Called Manually** only when user clicks refresh:

```tsx
const { mutate: refresh } = useRefreshRecommendations();

<button onClick={() => refresh(10)}>
  Refresh Recommendations
</button>
```

**When it's called:**
- ✅ User clicks "Refresh" button (ONLY)
- ✅ User clicks "Get New Recommendations" (ONLY)

---

## 📅 Complete User Journey Example

```
1. User Opens App
   → PostHogRecommendationSync starts listening
   
2. User Lands on Homepage
   → GET /api/v1/recommendations/status (auto)
   → Shows "Browse 10 more listings" message
   
3. User Searches "apartments in hanoi"
   → trackListing('SEARCH', 'homepage')
   → PostHog: "listing_searched" event captured
   → Added to buffer
   
4. User Clicks First Result
   → trackListing('CLICK', 'LST-001')
   → PostHog: "listing_clicked" event captured
   → Added to buffer (2 events)
   
5. User Views Listing Detail
   → trackListing('VIEW', 'LST-001')
   → PostHog: "listing_viewed" event captured
   → Added to buffer (3 events)
   
6. User Bookmarks Listing
   → trackListing('BOOKMARK', 'LST-001')
   → PostHog: "listing_bookmarked" event captured
   → Added to buffer (4 events)
   
7. User Continues Browsing... (6 more interactions)
   → Buffer reaches 10 events
   → 🚀 AUTO-FLUSH: POST /api/v1/recommendations/behavior
   → Backend receives all 10 events at once!
   
8. After Backend Ingestion
   → React Query auto-invalidates cache
   → GET /api/v1/recommendations/status (auto)
   → Returns: { event_count: 10, threshold_met: true }
   
9. User Returns to Homepage
   → Status shows threshold met!
   → GET /api/v1/recommendations (auto)
   → Recommendations displayed!
   
10. User Clicks "Refresh" Button
    → POST /api/v1/recommendations/refresh (manual)
    → New recommendations generated
```

---

## ⏰ API Call Frequency

| API | When | How Often | Trigger |
|-----|------|-----------|---------|
| **Ingest Behavior** | During browsing | Every 5s or 10 events | Automatic (PostHog) |
| **Get Status** | On mount + focus | Every 1 min | Automatic (React Query) |
| **Get Recommendations** | On mount + focus | Every 10 min | Automatic (React Query) |
| **Refresh Recommendations** | Button click | On demand | Manual only |

---

## 🎬 Real Implementation

### Step 1: Setup Provider (ONCE)
```tsx
// app/[locale]/layout.tsx
import { PostHogRecommendationSync } from '@/features/recommendation';

export default function Layout({ children }) {
  return (
    <PostHogProvider>
      <PostHogRecommendationSync />  {/* ← Add this ONCE */}
      {children}
    </PostHogProvider>
  );
}
```

### Step 2: Track Events (On Pages)
```tsx
// app/listings/[id]/page.tsx
import { usePostHogTracking } from '@/features/recommendation';

export default function ListingPage({ params }) {
  const { trackListing } = usePostHogTracking();
  
  useEffect(() => {
    trackListing('VIEW', params.id);  // ← Just track, API called automatically!
  }, [params.id]);
  
  return <div>Listing Details</div>;
}
```

### Step 3: Display Recommendations (On Pages)
```tsx
// app/page.tsx
import { useRecommendations } from '@/features/recommendation';

export default function HomePage() {
  const { data } = useRecommendations(6);  // ← API called automatically!
  
  return (
    <div>
      {data?.data.recommendations.map(listing => (
        <ListingCard key={listing.listing_id} {...listing} />
      ))}
    </div>
  );
}
```

---

## 🔑 Key Points

1. **99% Automatic**: Most API calls happen automatically via PostHog + React Query
2. **No Manual Batching**: PostHog events are auto-batched and sent to backend
3. **Smart Caching**: React Query caches responses and auto-invalidates when needed
4. **User-Friendly**: Users just browse normally, recommendations appear automatically!

---

## 🚀 What You Need to Do

### Required Setup (Do Once):
✅ Add `<PostHogRecommendationSync />` to root layout
✅ Use `usePostHogTracking()` on listing pages to track events

### That's It!
All API calls happen automatically. No manual calls, no manual batching, no manual cache management. Just track events with PostHog and the system handles the rest! 🎉
