'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { Skeleton } from '@/shared/ui/skeleton/skeleton';
import { Button } from '@/shared/ui/button/button';
import { recommendationQueries, recommendationApi, recommendationKeys } from '@/entities/recommendation';
import type { RecommendedListingDTO } from '@/entities/recommendation';
import { buildListingDetailUrl } from '@/shared/lib/utils';
import { behaviorTracker } from '@/shared/lib/analytics';

interface RecommendedListingsProps {
  sourcePage: 'buy' | 'rent';
}

/**
 * Recommended Listings Widget
 *
 * Displays AI-powered personalized listing recommendations.
 * Only renders for authenticated users.
 *
 * Features:
 * - Fetches recommendations from BE (cached or AI-generated)
 * - Shows behavior summary from AI
 * - Force-refresh button to regenerate
 * - Tracks clicks for further recommendation refinement
 */
export function RecommendedListings({ sourcePage }: RecommendedListingsProps) {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Home');
  const queryClient = useQueryClient();

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    ...recommendationQueries.forUser(6),
    enabled: authStatus === 'authenticated',
  });

  const recommendations = response?.payload?.data?.recommendations ?? [];

  const refreshMutation = useMutation({
    mutationFn: () => recommendationApi.refreshRecommendations(6),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all });
    },
  });

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

  return (
    <section className='bg-purple-98 w-full py-12 sm:py-16'>
      <div className='max-w-[1200px] mx-auto px-4 sm:px-6'>
        {/* Section Header */}
        <div className='flex items-center justify-between mb-6 sm:mb-8'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <Sparkles className='h-5 w-5 text-main-primary' />
              <h2 className='text-main-black text-xl sm:text-2xl font-bold leading-[1.5] tracking-[-0.24px]'>
                {t('recommendedForYou', { defaultMessage: 'Recommended for you' })}
              </h2>
            </div>
          </div>
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
            <span className='hidden sm:inline'>
              {t('refresh', { defaultMessage: 'Refresh' })}
            </span>
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div key={i}>
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
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className='flex items-center justify-center gap-2 text-red-500 py-8'>
            <AlertCircle className='h-5 w-5' />
            <p>
              {t('failedToLoadRecommendations', {
                defaultMessage: 'Failed to load recommendations',
              })}
            </p>
          </div>
        )}

        {/* Recommendations Grid */}
        {!isLoading && !isError && recommendations.length > 0 && (
          <div className='overflow-x-auto sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0'>
            <div className='flex gap-6 sm:gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-3 min-w-min sm:min-w-0'>
              {recommendations.map((listing) => (
                <div
                  key={listing.listing_id}
                  className='w-[280px] sm:w-auto flex-shrink-0 sm:flex-shrink h-full'
                >
                  <RealVistaListingCard
                    id={listing.listing_id}
                    image={
                      listing.thumbnail ||
                      'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'
                    }
                    title={listing.name}
                    address={listing.location}
                    price={listing.price}
                    listingType={listing.listing_type as 'RENT' | 'SALE'}
                    onClick={() => handleListingClick(listing)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && recommendations.length === 0 && (
          <div className='text-center py-12 text-main-secondary'>
            <Sparkles className='h-8 w-8 mx-auto mb-3 text-purple-80' />
            <p className='text-base font-medium mb-1'>
              {t('noRecommendationsYet', {
                defaultMessage: 'No recommendations yet',
              })}
            </p>
            <p className='text-sm'>
              {t('browseMoreListings', {
                defaultMessage: 'Browse more listings to get personalized recommendations',
              })}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
