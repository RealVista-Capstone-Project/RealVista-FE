'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { Skeleton } from '@/shared/ui/skeleton/skeleton';
import { Button } from '@/shared/ui/button/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/shared/ui/carousel';
import { recommendationQueries, recommendationApi, recommendationKeys } from '@/entities/recommendation';
import type { RecommendedListingDTO } from '@/entities/recommendation';
import { bookmarkApi } from '@/entities/bookmark';
import { settingPreferenceApi } from '@/entities/setting-preference';
import { buildListingDetailUrl } from '@/shared/lib/utils';
import { behaviorTracker } from '@/shared/lib/analytics';

/* ── Animation variants ─────────────────────────────────────────── */
const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

interface RecommendedListingsProps {
  sourcePage: 'buy' | 'rent';
}


/**
 * Recommended Listings Widget
 *
 * Displays AI-powered personalized listing recommendations in a horizontal carousel.
 * Only renders for authenticated users with recommendations available.
 *
 * Features:
 * - Embla Carousel (shadcn) horizontal carousel with prev/next navigation
 * - Fetches recommendations from BE (cached or AI-generated)
 * - Force-refresh button to regenerate
 * - Tracks clicks for further recommendation refinement
 * - Returns null when empty or unauthenticated
 */
export function RecommendedListings({ sourcePage }: RecommendedListingsProps) {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('RecommendedListings');
  const queryClient = useQueryClient();

  const { data: preferenceResponse } = useQuery({
    queryKey: ['setting-preference'],
    queryFn: () => settingPreferenceApi.get(),
    enabled: authStatus === 'authenticated',
  });

  const autoReload = preferenceResponse?.payload?.data?.auto_refresh_enabled ?? true;

  // ── Favorite overrides (optimistic local state) ───────────────
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});

  // Must match backend ListingType enum: SALE | RENT
  const listingType = sourcePage === 'buy' ? 'SALE' : 'RENT';

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    ...recommendationQueries.forUser(6, listingType),
    enabled: authStatus === 'authenticated',
  });

  // Poll status every 10s — only when autoReload is on
  const { data: statusResponse } = useQuery({
    ...recommendationQueries.status(),
    enabled: authStatus === 'authenticated' && autoReload,
    refetchInterval: autoReload ? 10000 : false,
  });

  const refreshMutation = useMutation({
    mutationFn: () => recommendationApi.refreshRecommendations(6, listingType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all });
    },
  });

  useEffect(() => {
    if (autoReload && statusResponse?.payload?.data?.threshold_met && !refreshMutation.isPending) {
      refreshMutation.mutate();
    }
  }, [statusResponse?.payload?.data?.threshold_met, refreshMutation, autoReload]);

  const recommendations: RecommendedListingDTO[] = response?.payload?.data?.recommendations ?? [];

  const handleToggleFavorite = async (id: string) => {
    // Find current status from overrides or response data
    const listing = recommendations.find((r) => r.listing_id === id);
    const currentFavorite = favoriteOverrides[id] ?? listing?.is_favorite ?? false;
    const nextFavorite = !currentFavorite;

    // Optimistic update for immediate feedback
    setFavoriteOverrides((prev) => ({ ...prev, [id]: nextFavorite }));

    try {
      await bookmarkApi.toggleBookmark(id);
      // Invalidate bookmark queries to keep global state in sync
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      // Track the action for AI feedback loop
      behaviorTracker.trackBookmark(id, nextFavorite ? 'add' : 'remove');
    } catch (error) {
      console.error('[RecommendedListings] Failed to toggle favorite:', error);
      // Revert optimistic update on failure
      setFavoriteOverrides((prev) => ({ ...prev, [id]: currentFavorite }));
    }
  };

  const handleListingClick = (listing: RecommendedListingDTO) => {
    behaviorTracker.trackClick(listing.listing_id, {
      listing_type: listing.listing_type as 'RENT' | 'SALE',
      price: listing.price,
      source_page: sourcePage,
    });
    router.push(buildListingDetailUrl(locale, listing.slug || listing.listing_id));
  };

  // Don't render for unauthenticated users
  if (authStatus !== 'authenticated') {
    return null;
  }

  // Don't render when empty (after loading completes)
  if (!isLoading && !isError && recommendations.length === 0) {
    return null;
  }

  return (
    <motion.section
      className='bg-primary/5 w-full py-8 sm:py-10'
      variants={sectionVariants}
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, amount: 0.15 }}
    >
      <div className='max-w-[1360px] mx-auto px-4 sm:px-6'>
        <Carousel
          opts={{
            align: 'start',
            loop: false,
            skipSnaps: false,
            slidesToScroll: 1,
            duration: 30,
          }}
          className='w-full'
        >
          {/* Section Header */}
          <div className='flex items-center justify-between mb-6 sm:mb-8'>
            <div className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-primary' />
              <h2 className='text-foreground text-xl sm:text-2xl font-bold leading-[1.5] tracking-[-0.24px]'>
                {t('recommendedForYou')}
              </h2>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className='flex items-center gap-2 text-primary border-primary/30 hover:border-primary hover:bg-primary/5 rounded-full px-4 transition-all duration-200'
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`}
                />
                <span className='text-sm font-medium'>Làm mới</span>
              </Button>
            </div>
          </div>

          {/* Loading State - Horizontal skeleton cards */}
          {(isLoading || isFetching) && (
            <div className='flex gap-3 overflow-hidden relative'>
              {/* Optional slight slide/fade for skeleton */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className='flex gap-3'
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className='w-[240px] flex-shrink-0'>
                      <div className='rounded-lg border-[1.5px] border-primary/10 bg-background p-3.5'>
                        <Skeleton className='aspect-[16/10] w-full rounded-t-lg mb-3' />
                        <Skeleton className='h-5 w-3/4 mb-2' />
                        <Skeleton className='h-4 w-1/2 mb-3' />
                        <Skeleton className='h-px w-full mb-3' />
                        <div className='flex gap-3 justify-center'>
                          <Skeleton className='h-4 w-10' />
                          <Skeleton className='h-4 w-10' />
                          <Skeleton className='h-4 w-10' />
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className='flex items-center justify-center gap-2 text-red-500 py-8'>
              <AlertCircle className='h-5 w-5' />
              <p>{t('failedToLoadRecommendations')}</p>
            </div>
          )}

          {/* Recommendations Carousel */}
          {(!isLoading && !isFetching && !isError && recommendations.length > 0) && (
            <CarouselContent className='-ml-3'>
              {recommendations.map((listing, index) => (
                <CarouselItem
                  key={listing.listing_id}
                  className='pl-3 basis-[220px] sm:basis-[240px] lg:basis-1/5'
                >
                  <motion.div
                    custom={index}
                    variants={cardVariants}
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true }}
                    className='h-full'
                  >
                    <RealVistaListingCard
                      id={listing.listing_id}
                      image={listing.thumbnail || ''}
                      title={listing.name}
                      address={listing.full_address}
                      price={listing.price}
                      area={listing.area}
                      attributes={listing.attributes}
                      listingType={listing.listing_type}
                      boostTags={listing.is_boosted ? listing.boost_packages : undefined}
                      isFavorite={favoriteOverrides[listing.listing_id] ?? listing.is_favorite ?? false}
                      onToggleFavorite={handleToggleFavorite}
                      onClick={() => handleListingClick(listing)}
                      compact
                      className='h-full transition-shadow duration-300 hover:shadow-lg'
                    />
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
          )}
        </Carousel>
      </div>
    </motion.section>
  );
}
