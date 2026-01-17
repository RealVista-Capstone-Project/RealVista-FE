# Business Boosting Feature Documentation

## Table of Contents

- [Overview](#overview)
- [Feature Types](#feature-types)
- [Architecture](#architecture)
- [Database Design](#database-design)
- [API Specification](#api-specification)
- [Boosting Algorithm](#boosting-algorithm)
- [Caching Strategy](#caching-strategy)
- [Frontend Implementation](#frontend-implementation)
- [Pricing Models](#pricing-models)
- [Analytics & ROI](#analytics--roi)
- [Best Practices](#best-practices)

---

## Overview

**Business Boosting** is a paid promotion feature that allows sellers and agents to increase visibility and engagement for their property listings through premium placements, badges, and priority in search results.

### Business Value

- **Revenue Generation**: New income stream from promotion fees
- **Seller Success**: Agents can accelerate their sales
- **Platform Quality**: Incentivizes high-quality listings
- **User Experience**: Featured listings are clearly marked and relevant

### Target Users

- **Sellers/Agents**: Want faster sales and more visibility
- **Buyers**: Discover premium/featured properties easily
- **Platform Admins**: Manage revenue and monitor abuse

---

## Feature Types

### 1. Featured Listing

**Description**: Highlighted placement at the top of search results and homepage carousel.

**Visual Indicators**:
- Gold/yellow border or background
- "Featured" badge
- Larger card size
- Priority position in feeds

**Duration**: 7, 14, or 30 days
**Starting Price**: $29.99 for 7 days

---

### 2. Spotlight/Pinned

**Description**: Guaranteed top #1-#3 position within a category or location.

**Visual Indicators**:
- Purple gradient border
- "Spotlight" animated badge
- Pin icon
- Subtle pulse animation

**Duration**: 7 or 30 days
**Starting Price**: $79.99 for 7 days

**Constraints**:
- Limited slots per category (3-5)
- First-come-first-served or auction-based

---

### 3. Hot/Urgent Badge

**Description**: Prominent badge indicating time-sensitive or highly desirable listings.

**Visual Indicators**:
- Red "Hot Deal" or "Just Listed" badge
- Countdown timer for limited offers
- Fire icon animation

**Duration**: 3-7 days
**Starting Price**: $9.99 for 7 days

---

### 4. Premium Placement

**Description**: Dedicated "Premium Listings" section with enhanced presentation.

**Visual Indicators**:
- Larger cards (2x size)
- More images in preview
- Video/3D tour autoplay
- "Premium" crown badge

**Duration**: 14 or 30 days
**Starting Price**: $49.99 for 14 days

---

### 5. Boosted Recommendations

**Description**: Priority placement in AI recommendation engine and "Similar Listings".

**Benefits**:
- Higher frequency in personalized feeds
- Cross-promotion in related categories
- Priority in email recommendations

**Duration**: 30 days
**Starting Price**: $39.99 for 30 days

---

## Architecture

### High-Level Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Listing  │  │ Featured │  │ Boost    │  │ Seller   │  │
│  │ Cards    │  │ Carousel │  │ Purchase │  │ Dashboard│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                      API GATEWAY                           │
│  /api/boost/*  /api/listings/*  /api/payments/*           │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                   SERVICES (FSD)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Boost    │  │ Listing  │  │ Payment  │  │ Analytics│  │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Recommend│  │ Notification│ Redis  │  │                │
│  │ Engine   │  │ Service  │  │ Cache   │  │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                      DATA LAYER                            │
│  PostgreSQL          Redis              ClickHouse         │
│  - listings          - boosted_ids      - events          │
│  - boosts            - ranking_cache    - metrics         │
│  - payments          - hot_listings     - roi             │
└────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Responsibilities |
|---------|------------------|
| **Boost Service** | Create, validate, schedule, expire boosts |
| **Listing Service** | Apply boost visibility to search results |
| **Payment Service** | Handle boost purchases, invoices, refunds |
| **Analytics Service** | Track impressions, clicks, conversions |
| **Recommendation Engine** | Prioritize boosted listings in AI feeds |
| **Notification Service** | Alert users on boost start/expiry |

---

## Database Design

### ER Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   users          │       │ boost_packages   │       │   payments       │
│  ────────────    │       │  ────────────    │       │  ────────────    │
│  id (PK)         │       │  id (PK)         │       │  id (PK)         │
│  email           │       │  name            │       │  user_id (FK)    │
│  role            │       │  type            │       │  amount          │
│  ...             │       │  duration_days   │       │  status          │
└────────┬─────────┘       │  price           │       └──────────────────┘
         │                 │  ...             │                ▲
         │                 └──────────────────┘                │
         │                           ▲                          │
         │                           │                          │
         │                           │                          │
         ▼                           │                          │
┌──────────────────┐       ┌──────────────────────────────────┴──────┐
│   listings       │       │           listing_boosts                 │
│  ────────────    │  ┌─── │  ────────────────────────               │
│  id (PK)         │  │    │  id (PK)                               │
│  seller_id (FK)  │────┤   │  listing_id (FK)                      │
│  title           │  │   │  package_id (FK)                       │
│  status          │  │   │  user_id (FK)                          │
│  ...             │  │   │  status                                │
└──────────────────┘  │    │  start_time                            │
                      │    │  end_time                              │
                      │    │  priority_score                        │
                      │    │  payment_id (FK)                       │
                      │    │  ...                                   │
                      │    └────────────────────────────────────────┘
                      │                    ▲
                      │                    │
                      │    ┌───────────────┴──────────────┐
                      │    │                               │
                      ▼    ▼                               ▼
              ┌──────────────────┐           ┌──────────────────────┐
              │   boost_slots     │           │boost_analytics_events│
              │  ────────────    │           │  ──────────────────   │
              │  id (PK)         │           │  id (PK)              │
              │  location        │           │  boost_id (FK)        │
              │  slot_number     │           │  event_type           │
              │  listing_id (FK) │           │  user_id (FK)         │
              │  boost_id (FK)   │           │  metadata             │
              │  valid_from      │           │  created_at           │
              │  valid_until     │           └──────────────────────┘
              └──────────────────┘
```

### Tables

#### boost_packages

Defines available boost packages with pricing and features.

```sql
CREATE TABLE boost_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,            -- 'featured', 'spotlight', 'badge', 'premium'
    duration_days INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features JSONB,                        -- {"badge": true, "position": 1}
    max_slots_per_category INTEGER DEFAULT 10,
    max_per_user INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE boost_packages IS 'Available boost packages for purchase';
COMMENT ON COLUMN boost_packages.features IS 'JSON with package capabilities and display options';
```

**Sample Data**:

```sql
INSERT INTO boost_packages (name, type, duration_days, price, features) VALUES
('Featured - 7 Days', 'featured', 7, 29.99, '{"badge": true, "homepage_carousel": true, "search_top": true}'::jsonb),
('Spotlight - 7 Days', 'spotlight', 7, 79.99, '{"badge": true, "guaranteed_position": 3, "priority_score": 300}'::jsonb),
('Hot Badge - 7 Days', 'badge', 7, 9.99, '{"badge": "hot", "countdown_timer": true}'::jsonb),
('Premium - 14 Days', 'premium', 14, 49.99, '{"badge": true, "larger_card": true, "video_autoplay": true}'::jsonb);
```

---

#### listing_boosts

Active boost campaigns for listings.

```sql
CREATE TABLE listing_boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES boost_packages(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Status & Schedule
    status VARCHAR(20) DEFAULT 'pending',     -- 'pending', 'active', 'paused', 'expired', 'cancelled'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    -- Priority for ranking
    priority_score INTEGER DEFAULT 0,

    -- Analytics counters (denormalized for performance)
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    inquiries INTEGER DEFAULT 0,

    -- Payment
    payment_id UUID REFERENCES payments(id),
    amount_paid DECIMAL(10,2),

    -- Metadata
    metadata JSONB,                           -- {"promo_code": "SAVE20", "notes": "..."}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_dates CHECK (end_time > start_time),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'paused', 'expired', 'cancelled'))
);

CREATE INDEX idx_boosts_listing ON listing_boosts(listing_id);
CREATE INDEX idx_boosts_user ON listing_boosts(user_id);
CREATE INDEX idx_boosts_status_time ON listing_boosts(status, start_time, end_time);
CREATE INDEX idx_boosts_priority ON listing_boosts(priority_score DESC, created_at DESC);
CREATE INDEX idx_boosts_active_listing ON listing_boosts(listing_id) WHERE status = 'active';
```

**Status Flow**:

```
pending → active → expired
    ↓         ↓
cancelled  paused → active
```

---

#### boost_slots

Manages guaranteed position slots (e.g., top 3 in category).

```sql
CREATE TABLE boost_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(100) NOT NULL,          -- 'homepage', 'category:apartments', 'search:hanoi'
    slot_number INTEGER NOT NULL,            -- 1, 2, 3, ... N
    listing_id UUID REFERENCES listings(id),
    boost_id UUID REFERENCES listing_boosts(id),
    user_id UUID REFERENCES users(id),

    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_slot UNIQUE (location, slot_number, valid_from, valid_until)
);

CREATE INDEX idx_slots_location_time ON boost_slots(location, valid_from, valid_until);
CREATE INDEX idx_slots_listing ON boost_slots(listing_id);
```

**Slot Allocation Logic**:

1. User requests "Spotlight" boost
2. System finds available slots in target category
3. If slot available → allocate
4. If full → add to waitlist or suggest alternative

---

#### boost_analytics_events

Event-level tracking for analytics.

```sql
CREATE TABLE boost_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boost_id UUID NOT NULL REFERENCES listing_boosts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,         -- 'impression', 'click', 'save', 'inquiry'
    user_id UUID REFERENCES users(id),       -- NULL for anonymous
    session_id VARCHAR(255),
    metadata JSONB,                          -- {"source": "search", "position": 3, "device": "mobile"}
    created_at TIMESTAMP DEFAULT NOW()
);

-- Partition by month for performance
CREATE TABLE boost_analytics_events_2026_01 PARTITION OF boost_analytics_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE INDEX idx_analytics_boost_time ON boost_analytics_events(boost_id, created_at DESC);
CREATE INDEX idx_analytics_type_time ON boost_analytics_events(event_type, created_at DESC);
```

**Event Types**:

| Event | Description |
|-------|-------------|
| `impression` | Listing displayed to user |
| `click` | User clicked on listing |
| `save` | User saved/favorited listing |
| `inquiry` | User sent inquiry/message |
| `appointment` | User scheduled viewing |

---

## API Specification

### Endpoints

#### Boost Packages

```http
GET /api/boost/packages
```

**Description**: List all available boost packages

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Featured - 7 Days",
      "type": "featured",
      "durationDays": 7,
      "price": 29.99,
      "features": {
        "badge": true,
        "homepageCarousel": true,
        "searchTop": true
      },
      "maxPerUser": 3,
      "isActive": true
    }
  ]
}
```

---

#### Purchase Boost

```http
POST /api/boost/purchase
```

**Description**: Purchase a boost for a listing

**Request**:
```json
{
  "listingId": "uuid",
  "packageId": "uuid",
  "startTime": "2026-01-20T00:00:00Z",
  "promoCode": "SAVE20"
}
```

**Response**:
```json
{
  "data": {
    "boostId": "uuid",
    "status": "pending",
    "startTime": "2026-01-20T00:00:00Z",
    "endTime": "2026-01-27T00:00:00Z",
    "amountCharged": 29.99,
    "paymentIntentId": "pi_1234567890"
  }
}
```

**Validation Rules**:
- Listing must belong to user
- Listing must be `active` or `pending_approval`
- User cannot exceed max boosts per package
- Start time must be in future

---

#### Get My Boosts

```http
GET /api/boost/my-boosts?status=active
```

**Description**: Get current user's boosts

**Query Params**:
- `status`: Filter by status (`active`, `expired`, `pending`)
- `listingId`: Filter by listing
- `page`: Page number
- `limit`: Results per page

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "listing": {
        "id": "uuid",
        "title": "Luxury Apartment in Hanoi",
        "thumbnail": "https://..."
      },
      "package": {
        "name": "Featured",
        "type": "featured"
      },
      "status": "active",
      "startTime": "2026-01-15T00:00:00Z",
      "endTime": "2026-01-22T00:00:00Z",
      "analytics": {
        "impressions": 1523,
        "clicks": 89,
        "ctr": 5.84,
        "inquiries": 5
      }
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10
  }
}
```

---

#### Get Boosted Listings

```http
GET /api/listings/boosted?location=homepage&limit=10
```

**Description**: Get boosted listings for a specific location

**Query Params**:
- `location`: `homepage`, `category:{slug}`, `search`
- `type`: Filter by boost type (optional)
- `limit`: Max results (default: 10)

**Response**:
```json
{
  "data": {
    "spotlight": [
      {
        "listing": { /* Listing object */ },
        "boost": {
          "type": "spotlight",
          "badge": "Spotlight",
          "expiresAt": "2026-01-22T00:00:00Z"
        }
      }
    ],
    "featured": [ /* ... */ ],
    "premium": [ /* ... */ ]
  }
}
```

---

#### Pause/Resume Boost

```http
PUT /api/boost/:boostId/pause
PUT /api/boost/:boostId/resume
```

**Description**: Temporarily pause or resume a boost

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "status": "paused",
    "pausedAt": "2026-01-18T10:30:00Z",
    "remainingTime": "5 days 12 hours"
  }
}
```

**Note**: Paused boosts don't consume time but remain paid.

---

#### Get Analytics

```http
GET /api/boost/:boostId/analytics?period=7d
```

**Description**: Get performance analytics for a boost

**Query Params**:
- `period`: `24h`, `7d`, `30d`, `all`
- `granularity`: `hour`, `day`, `week`

**Response**:
```json
{
  "data": {
    "boostId": "uuid",
    "period": "7d",
    "metrics": {
      "impressions": 15234,
      "clicks": 892,
      "ctr": 5.86,
      "saves": 45,
      "inquiries": 12,
      "conversionRate": 1.35,
      "costPerInquiry": 2.50,
      "roi": 245.5
    },
    "comparison": {
      "vsOrganic": "+156%",
      "vsCategoryAvg": "+89%"
    },
    "timeline": [
      {
        "date": "2026-01-15",
        "impressions": 2145,
        "clicks": 127
      }
    ]
  }
}
```

---

### Error Responses

**400 Bad Request**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Listing already has an active boost of this type",
    "details": {
      "field": "packageId",
      "conflict": {
        "boostId": "uuid",
        "expiresAt": "2026-01-20T00:00:00Z"
      }
    }
  }
}
```

**402 Payment Required**:
```json
{
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment could not be processed",
    "details": {
      "stripeError": "card_declined"
    }
  }
}
```

---

## Boosting Algorithm

### Priority Score Calculation

```typescript
interface BoostScoreConfig {
  basePriority: number;        // Base score (100)
  packageMultiplier: Record<string, number>;  // Type multipliers
  urgencyBonus: number;        // New boost bonus (50)
  timeDecay: number;           // Daily decay (2)
  ctrWeight: number;           // CTR influence (10)
  conversionWeight: number;    // Conversion influence (20)
}

function calculateBoostPriority(
  boost: ListingBoost,
  analytics: BoostAnalytics,
  config: BoostScoreConfig
): number {
  // 1. Base score from package
  let score = config.basePriority;

  // 2. Package type multiplier
  const multipliers = {
    spotlight: 3.0,
    featured: 2.0,
    premium: 1.8,
    badge: 1.2,
  };
  score *= multipliers[boost.package.type] || 1;

  // 3. Urgency bonus (newer gets priority)
  const daysActive = differenceInDays(new Date(), boost.startTime);
  score += Math.max(0, config.urgencyBonus - (daysActive * config.timeDecay));

  // 4. Performance bonus (CTR and conversions)
  const ctr = analytics.clicks / Math.max(1, analytics.impressions);
  const conversionRate = analytics.inquiries / Math.max(1, analytics.clicks);
  score += (ctr * config.ctrWeight) + (conversionRate * config.conversionWeight);

  // 5. Small randomization to prevent static ordering
  score += Math.random() * 0.5;

  return Math.round(score * 100) / 100;
}
```

### Ranking in Search Results

```typescript
function rankListingsWithBoosts(
  listings: Listing[],
  boostedIds: Set<string>,
  boostScores: Map<string, number>
): Listing[] {
  // Separate boosted and regular listings
  const boosted: Listing[] = [];
  const regular: Listing[] = [];

  for (const listing of listings) {
    if (boostedIds.has(listing.id)) {
      boosted.push({
        ...listing,
        _boostScore: boostScores.get(listing.id)!,
      });
    } else {
      regular.push(listing);
    }
  }

  // Sort boosted by score (highest first)
  boosted.sort((a, b) => b._boostScore - a._boostScore);

  // Sort regular by relevance (default)
  regular.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Interleave: maintain ~80/20 ratio
  const result: Listing[] = [];
  let boostIndex = 0;
  let regularIndex = 0;
  const boostRatio = 0.2; // 20% boosted max

  while (boostIndex < boosted.length || regularIndex < regular.length) {
    const boostCount = result.filter((_, i) => i % 5 === 0).length;
    const totalCount = result.length;

    if (boostIndex < boosted.length && (boostCount / totalCount) < boostRatio) {
      result.push(boosted[boostIndex++]);
    }

    if (regularIndex < regular.length) {
      result.push(regular[regularIndex++]);
    }
  }

  return result;
}
```

### Slot Allocation

```typescript
async function allocateSpotlightSlot(
  location: string,
  listingId: string,
  userId: string,
  startTime: Date,
  endTime: Date
): Promise<{ success: boolean; slot?: number; reason?: string }> {
  const maxSlots = 3; // Top 3 positions

  // Find occupied slots
  const occupied = await db.boost_slots.findMany({
    where: {
      location,
      valid_from: { lte: endTime },
      valid_until: { gte: startTime },
    },
    select: { slot_number: true },
  });

  const occupiedSlots = new Set(occupied.map((s) => s.slot_number));

  // Find first available slot
  for (let slot = 1; slot <= maxSlots; slot++) {
    if (!occupiedSlots.has(slot)) {
      // Allocate slot
      await db.boost_slots.create({
        data: {
          location,
          slot_number: slot,
          listing_id: listingId,
          user_id: userId,
          valid_from: startTime,
          valid_until: endTime,
        },
      });

      return { success: true, slot };
    }
  }

  return { success: false, reason: 'All slots occupied for this period' };
}
```

---

## Caching Strategy

### Redis Cache Structure

``# Boosted listings by location
boosted:listings:{location}
  Type: Sorted Set
  Score: priority_score
  Value: listing_id
  TTL: 5 minutes

# Slot allocations
boost:slot:{location}:{slot_number}
  Type: String
  Value: JSON listing data
  TTL: Until valid_until

# Individual boost status
boost:status:{listing_id}
  Type: Hash
  Fields: type, expires_at, priority_score
  TTL: Until end_time

# User's active boosts
user:{user_id}:boosts
  Type: Set
  Members: boost_ids
  TTL: 1 hour
```

### Cache Implementation

```typescript
class BoostCacheService {
  private redis: Redis;

  // Check if listing is boosted (O(1) lookup)
  async isListingBoosted(listingId: string): Promise<BoostInfo | null> {
    const cached = await this.redis.hgetall(`boost:status:${listingId}`);

    if (!cached || Object.keys(cached).length === 0) {
      // Cache miss - fetch from DB
      const boost = await db.listing_boosts.findFirst({
        where: {
          listing_id: listingId,
          status: 'active',
          end_time: { gte: new Date() },
        },
        include: { package: true },
      });

      if (!boost) return null;

      // Cache it
      const info = {
        type: boost.package.type,
        expiresAt: boost.end_time.getTime(),
        priorityScore: boost.priority_score,
      };

      await this.redis.hset(`boost:status:${listingId}`, info);
      await this.redis.pexpireat(
        `boost:status:${listingId}`,
        boost.end_time.getTime()
      );

      return info;
    }

    return {
      type: cached.type,
      expiresAt: parseInt(cached.expiresAt),
      priorityScore: parseInt(cached.priorityScore),
    };
  }

  // Get boosted listings for a location
  async getBoostedListings(
    location: string,
    limit: number
  ): Promise<string[]> {
    const cacheKey = `boosted:listings:${location}`;

    // Try cache first
    let listingIds = await this.redis.zrevrange(cacheKey, 0, limit - 1);

    if (listingIds.length === 0) {
      // Cache miss - fetch from DB
      const boosts = await db.listing_boosts.findMany({
        where: {
          status: 'active',
          start_time: { lte: new Date() },
          end_time: { gte: new Date() },
        },
        include: {
          listing: {
            include: {
              category: true,
              location: true,
            },
          },
        },
        orderBy: { priority_score: 'desc' },
        take: limit,
      });

      listingIds = boosts.map((b) => b.listing_id);

      // Populate cache
      const pipeline = this.redis.pipeline();
      for (const boost of boosts) {
        pipeline.zadd(cacheKey, {
          score: boost.priority_score,
          value: boost.listing_id,
        });
      }
      pipeline.expire(cacheKey, 300); // 5 minutes
      await pipeline.exec();
    }

    return listingIds;
  }

  // Invalidate cache on boost changes
  async invalidateBoost(listingId: string, locations: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Clear status cache
    pipeline.del(`boost:status:${listingId}`);

    // Clear location caches
    for (const location of locations) {
      pipeline.del(`boosted:listings:${location}`);
    }

    await pipeline.exec();
  }
}
```

---

## Frontend Implementation

### Component Structure (FSD)

```
src/
├── entities/
│   └── boost/
│       ├── model/
│       │   ├── types.ts
│       │   └── store.ts
│       └── ui/
│           ├── ListingBadge.tsx
│           ├── FeaturedCarousel.tsx
│           └── BoostStatsCard.tsx
├── features/
│   └── boost/
│       ├── api/
│       │   ├── purchase-boost.ts
│       │   └── get-boost-analytics.ts
│       ├── ui/
│       │   ├── BoostPurchaseDialog.tsx
│       │   └── MyBoostsDashboard.tsx
│       └── i18n/
│           └── vi.json
└── shared/
    └── segments/
        └── boost/
            └── config.ts
```

### Listing Badge Component

```typescript
// src/entities/boost/ui/ListingBadge.tsx
import { Badge } from '@/shared/ui/badge';
import { Star, Sparkles, Crown, Flame } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type BoostType = 'featured' | 'spotlight' | 'premium' | 'hot';

interface ListingBadgeProps {
  type: BoostType;
  className?: string;
  showIcon?: boolean;
}

export function ListingBadge({
  type,
  className,
  showIcon = true,
}: ListingBadgeProps) {
  const config = {
    featured: {
      label: 'Featured',
      variant: 'yellow' as const,
      icon: Star,
      className: 'bg-yellow-500 text-white',
    },
    spotlight: {
      label: 'Spotlight',
      variant: 'purple' as const,
      icon: Sparkles,
      className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    },
    premium: {
      label: 'Premium',
      variant: 'orange' as const,
      icon: Crown,
      className: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white',
    },
    hot: {
      label: 'Hot Deal',
      variant: 'red' as const,
      icon: Flame,
      className: 'bg-red-500 text-white',
    },
  };

  const { label, icon: Icon, className: defaultClassName } = config[type];

  return (
    <Badge className={cn(defaultClassName, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );
}
```

### Boost Purchase Dialog

```typescript
// src/features/boost/ui/BoostPurchaseDialog.tsx
import { Dialog, DialogContent, DialogHeader } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Check } from 'lucide-react';
import { usePurchaseBoost } from '../api/use-purchase-boost';
import { boostPackages } from '@/shared/segments/boost/config';

interface BoostPurchaseDialogProps {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BoostPurchaseDialog({
  listingId,
  open,
  onOpenChange,
  onSuccess,
}: BoostPurchaseDialogProps) {
  const purchaseBoost = usePurchaseBoost();

  const handlePurchase = async (packageId: string) => {
    try {
      await purchaseBoost.mutateAsync({
        listingId,
        packageId,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <h2 className="text-2xl font-bold">Boost Your Listing</h2>
          <p className="text-muted-foreground">
            Get more visibility and sell faster
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {boostPackages.map((pkg) => (
            <BoostPackageCard
              key={pkg.id}
              package={pkg}
              onSelect={() => handlePurchase(pkg.id)}
              disabled={purchaseBoost.isPending}
            />
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Why boost your listing?</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• 3x more views on average</li>
            <li>• Appear at the top of search results</li>
            <li>• Featured on homepage carousel</li>
            <li>• Track performance with analytics</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BoostPackageCardProps {
  package: BoostPackage;
  onSelect: () => void;
  disabled?: boolean;
}

function BoostPackageCard({ package: pkg, onSelect, disabled }: BoostPackageCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:scale-105 hover:shadow-lg',
        'border-2 hover:border-primary',
        pkg.type === 'spotlight' && 'border-purple-500 bg-purple-50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={!disabled ? onSelect : undefined}
    >
      <CardHeader>
        <CardTitle className="text-lg">{pkg.name}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">${pkg.price}</span>
          <span className="text-sm text-muted-foreground">
            /{pkg.durationDays} days
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {pkg.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full mt-4" disabled={disabled}>
          Purchase
        </Button>
      </CardContent>
    </Card>
  );
}
```

### My Boosts Dashboard

```typescript
// src/features/boost/ui/MyBoostsDashboard.tsx
import { useMyBoosts } from '../api/use-my-boosts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { ListingBadge } from '@/entities/boost/ui/ListingBadge';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function MyBoostsDashboard() {
  const { data: boosts, isLoading } = useMyBoosts({ status: 'active' });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Active Boosts</h2>
        <p className="text-muted-foreground">
          Track your boosted listings performance
        </p>
      </div>

      {boosts?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No active boosts</p>
            <Button className="mt-4">Browse Packages</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boosts?.map((boost) => (
            <BoostCard key={boost.id} boost={boost} />
          ))}
        </div>
      )}
    </div>
  );
}

function BoostCard({ boost }: { boost: ListingBoost }) {
  const timeLeft = formatDistanceToNow(new Date(boost.endTime), {
    addSuffix: true,
    locale: vi,
  });

  const ctr = (boost.analytics.clicks / boost.analytics.impressions) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1">
            {boost.listing.title}
          </CardTitle>
          <ListingBadge type={boost.package.type} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <img
          src={boost.listing.thumbnail}
          alt={boost.listing.title}
          className="w-full h-40 object-cover rounded-md"
        />

        <div className="text-sm">
          <span className="text-muted-foreground">Expires in </span>
          <span className="font-semibold">{timeLeft}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-2xl font-bold">
              {boost.analytics.impressions.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{ctr.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">CTR</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Analytics
          </Button>
          <Button variant="outline" size="sm">
            Pause
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Pricing Models

### Option 1: Per-Listing Pricing

| Package | Duration | Price | Best For |
|---------|----------|-------|----------|
| Hot Badge | 7 days | $9.99 | Casual sellers |
| Featured | 7 days | $29.99 | Standard listings |
| Featured | 14 days | $49.99 | High-demand properties |
| Spotlight | 7 days | $79.99 | Urgent sales |
| Spotlight | 30 days | $199.99 | Premium agents |
| Premium | 14 days | $49.99 | Luxury properties |

### Option 2: Subscription Tiers

| Tier | Monthly | Boosts Included | Additional |
|------|---------|-----------------|------------|
| Starter | $49/mo | 2 Featured | $15/boost |
| Professional | $149/mo | 5 Featured + 1 Spotlight | $25/boost |
| Agency | $499/mo | Unlimited Featured + 5 Spotlight | $20/boost |

### Option 3: Performance-Based (CPA)

- **Cost Per Inquiry**: $5-15 per qualified lead
- **Cost Per Acquisition**: 1-2% of sale price
- **Hybrid**: Base fee + commission

---

## Analytics & ROI

### Key Metrics

```typescript
interface BoostMetrics {
  // Visibility
  impressions: number;          // Total views
  uniqueUsers: number;          // Unique visitors
  avgPosition: number;          // Average display position

  // Engagement
  clicks: number;               // Clicks to detail page
  ctr: number;                  // Click-through rate (%)
  saves: number;                // Favorites/saves
  shares: number;               // Social shares

  // Conversion
  inquiries: number;            // Messages/contacts
  appointments: number;         // Scheduled viewings
  conversionRate: number;       // Inquiries / clicks (%)

  // Financial
  costPerInquiry: number;       // Total cost / inquiries
  costPerAcquisition: number;   // Total cost / successful deals
  roi: number;                  // Return on investment (%)

  // Comparative
  vsOrganicLift: number;        // Performance vs non-boosted
  vsCategoryAvg: number;        // vs category average
}
```

### ROI Calculation

```typescript
function calculateBoostROI(
  boost: ListingBoost,
  avgPropertyValue: number
): number {
  const totalCost = boost.amountPaid;

  // Estimated deal value (assuming 2% commission)
  const closedDeals = boost.analytics.inquiries * 0.15; // 15% close rate
  const dealValue = closedDeals * avgPropertyValue * 0.02;

  // ROI = (Revenue - Cost) / Cost * 100
  const roi = ((dealValue - totalCost) / totalCost) * 100;

  return Math.round(roi);
}
```

---

## Best Practices

### ✅ DO

1. **Transparency**
   - Always mark boosted listings clearly
   - Show "Sponsored" or "Ad" labels
   - Display boost status publicly

2. **Quality Control**
   - Require listing approval before boosting
   - Don't allow low-quality/incomplete listings
   - Verify high-quality images

3. **Fair Allocation**
   - Limit boosts per category (max 20-30%)
   - Rotate positions to prevent domination
   - Enforce maximum boosts per user

4. **Performance Monitoring**
   - Track ROI for each boost
   - A/B test badge designs and placements
   - Monitor user satisfaction

5. **Graceful Degradation**
   - If boost service fails, show normal listing
   - Never break search due to boost errors
   - Have fallback UI for expired boosts

### ❌ DON'T

1. Don't hide that listings are boosted
2. Don't let boosted listings exceed 30% of results
3. Don't allow boosting for spammy/low-quality listings
4. Don't auto-renew without explicit consent
5. Don't show same boosted listing to same user repeatedly

---

## Security Considerations

1. **Payment Security**
   - Use Stripe/PayPal for secure payments
   - Never store card details
   - Implement refund handling

2. **Fraud Prevention**
   - Rate limit boost purchases
   - Detect and block bot traffic
   - Monitor for suspicious patterns

3. **Access Control**
   - Only listing owner can boost
   - Admin override capability
   - Audit all boost activities

---

## Future Enhancements

- [ ] A/B testing for boost placements
- [ ] Dynamic pricing based on demand
- [ ] Package customization
- [ ] Boost bundles (save with multiple)
- [ ] Seasonal promotions
- [ ] Agent-level subscription plans
- [ ] Automated optimization suggestions
- [ ] Integration with CRM systems
