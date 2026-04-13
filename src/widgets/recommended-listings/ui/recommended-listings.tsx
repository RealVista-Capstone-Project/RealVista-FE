'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { Skeleton } from '@/shared/ui/skeleton/skeleton';
import { Button } from '@/shared/ui/button/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from '@/shared/ui/carousel';
import { recommendationQueries, recommendationApi, recommendationKeys } from '@/entities/recommendation';
import type { RecommendedListingDTO } from '@/entities/recommendation';
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
 * Carousel navigation arrows placed in the section header.
 * Must be rendered inside a <Carousel> provider so useCarousel() works.
 */
function CarouselNavButtons() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();

  return (
    <>
      <button
        type='button'
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className='hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-purple-90 bg-white text-main-primary transition-all duration-200 hover:bg-purple-96 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100'
        aria-label='Previous recommendations'
      >
        <ChevronLeft className='h-4 w-4' />
      </button>
      <button
        type='button'
        onClick={scrollNext}
        disabled={!canScrollNext}
        className='hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-purple-90 bg-white text-main-primary transition-all duration-200 hover:bg-purple-96 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100'
        aria-label='Next recommendations'
      >
        <ChevronRight className='h-4 w-4' />
      </button>
    </>
  );
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

  // ── Auto-reload toggle (persisted to localStorage) ───────────
  const [autoReload, setAutoReload] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('recommendation_auto_reload');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('recommendation_auto_reload', String(autoReload));
  }, [autoReload]);

  // ── Favorite overrides (optimistic local state) ───────────────
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});

  const handleToggleFavorite = (id: string) => {
    setFavoriteOverrides((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const listingType = sourcePage === 'buy' ? 'BUY' : 'RENT';

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
      className='bg-purple-98 w-full py-12 sm:py-16'
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
              <Sparkles className='h-5 w-5 text-main-primary' />
              <h2 className='text-main-black text-xl sm:text-2xl font-bold leading-[1.5] tracking-[-0.24px]'>
                {t('recommendedForYou')}
              </h2>
            </div>
            <div className='flex items-center gap-2'>
              {/* Auto-reload pill toggle */}
              <button
                type='button'
                onClick={() => setAutoReload((v) => !v)}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  autoReload
                    ? 'bg-main-primary/10 border-main-primary text-main-primary'
                    : 'bg-white border-purple-90 text-grey-400'
                }`}
                aria-label='Toggle auto-reload'
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    autoReload ? 'bg-main-primary animate-pulse' : 'bg-grey-300'
                  }`}
                />
                Auto
              </button>
              <CarouselNavButtons />
              <Button
                variant='outline'
                size='sm'
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className='flex items-center gap-2 text-main-primary border-main-primary hover:bg-purple-96'
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>

          {/* Loading State - Horizontal skeleton cards */}
          {(isLoading || isFetching) && (
            <div className='flex gap-4 overflow-hidden relative'>
              {/* Optional slight slide/fade for skeleton */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className='flex gap-4'
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className='w-[300px] flex-shrink-0'>
                      <div className='rounded-lg border-[1.5px] border-purple-96 bg-white p-6'>
                        <Skeleton className='aspect-[16/10] w-full rounded-t-lg mb-6' />
                        <Skeleton className='h-8 w-3/4 mb-3' />
                        <Skeleton className='h-6 w-1/2 mb-4' />
                        <Skeleton className='h-px w-full mb-4' />
                        <div className='flex gap-4 justify-center'>
                          <Skeleton className='h-5 w-12' />
                          <Skeleton className='h-5 w-12' />
                          <Skeleton className='h-5 w-12' />
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
            <CarouselContent className='-ml-4'>
              {recommendations.map((listing, index) => (
                <CarouselItem
                  key={listing.listing_id}
                  className='pl-4 basis-[280px] sm:basis-[300px] lg:basis-1/4'
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
