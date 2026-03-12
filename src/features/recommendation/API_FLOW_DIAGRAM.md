# Backend API Call Flow with PostHog

## 🔄 Complete Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER ACTIONS                                │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  usePostHogTracking().trackListing()                                │
│  • trackListing('VIEW', listingId)                                  │
│  • trackListing('CLICK', listingId)                                 │
│  • trackListing('BOOKMARK', listingId)                              │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PostHog Captures Event                                             │
│  • listing_viewed                                                   │
│  • listing_clicked                                                  │
│  • listing_bookmarked                                               │
│  • listing_searched                                                 │
│  • listing_inquiry_sent                                             │
│  • listing_shared                                                   │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PostHogRecommendationSync (Listening)                              │
│  • Detects listing-related events                                   │
│  • Converts to backend format                                       │
│  • Adds to buffer                                                   │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Event Buffer                                                       │
│  [event1, event2, event3, ...]                                      │
│                                                                     │
│  Flush Triggers:                                                    │
│  • 5 seconds elapsed                                                │
│  • 10 events accumulated                                            │
│  • Page beforeunload                                                │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  🚀 POST /api/v1/recommendations/behavior                           │
│                                                                     │
│  Body: {                                                            │
│    "events": [                                                      │
│      {                                                              │
│        "event_type": "view",                                        │
│        "listing_id": "LST-001",                                     │
│        "duration_seconds": 120,                                     │
│        "metadata": {...}                                            │
│      }                                                              │
│    ]                                                                │
│  }                                                                  │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Backend Processing                                                 │
│  • Java Controller receives request                                 │
│  • Forwards to AI microservice (NestJS)                             │
│  • AI service stores vectors in Qdrant                              │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  React Query Cache Invalidation                                     │
│  • Auto-invalidates recommendations                                 │
│  • Auto-invalidates status                                          │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  🔄 GET /api/v1/recommendations/status                              │
│                                                                     │
│  Response: {                                                        │
│    "event_count": 10,                                               │
│    "threshold_met": true                                            │
│  }                                                                  │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  When threshold_met = true                                          │
│  🎯 GET /api/v1/recommendations?limit=10                            │
│                                                                     │
│  Response: {                                                        │
│    "recommendations": [                                             │
│      {                                                              │
│        "listing_id": "LST-123",                                     │
│        "name": "Beautiful Apartment",                               │
│        "reason": "Based on your bookmarks...",                      │
│        "score": 0.95                                                │
│      }                                                              │
│    ]                                                                │
│  }                                                                  │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Display to User                                                    │
│  • Show personalized recommendations                                │
│  • User can refresh manually                                        │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎯 API Call Triggers Summary

### Automatic Calls (No Developer Action)

| API | Triggered By | Frequency |
|-----|--------------|-----------|
| `POST /behavior` | PostHog events | Every 5s or 10 events |
| `GET /status` | Component mount, focus | Every 1 min (cache) |
| `GET /recommendations` | Component mount, focus | Every 10 min (cache) |

### Manual Calls (User Action Required)

| API | Triggered By | Frequency |
|-----|--------------|-----------|
| `POST /refresh` | Button click | On demand |

## 📝 Developer Checklist

### ✅ One-Time Setup
1. Add `<PostHogRecommendationSync />` to root layout
2. That's it! Everything else is automatic.

### ✅ Per Page
1. Import `usePostHogTracking()`
2. Call `trackListing()` for user actions
3. That's it! API calls happen automatically.

### ✅ Display Recommendations
1. Import `useRecommendations()`
2. Render the data
3. That's it! Fetching and caching is automatic.

## 🚀 Zero Configuration Needed

Once set up, the system:
- ✅ Captures all listing interactions via PostHog
- ✅ Batches events intelligently
- ✅ Sends to backend automatically
- ✅ Fetches recommendations automatically
- ✅ Manages cache automatically
- ✅ Invalidates when needed automatically

**You just track events. Everything else is automatic!** 🎉
