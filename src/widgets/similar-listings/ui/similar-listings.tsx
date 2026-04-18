'use client';

import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookmarkApi } from '@/entities/bookmark';
import {
  listingQueries,
  mapSimilarListingsToCardProps,
  type SimilarListingCardProps,
} from '@/entities/listing';
import { Skeleton } from '@/shared/ui/skeleton/skeleton';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { buildListingDetailUrl } from '@/shared/lib/utils';
import { behaviorTracker } from '@/shared/lib/analytics';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/shared/ui/carousel';

export interface SimilarListingsProps {
  propertyId?: string;
  onPropertyClick?: (slug: string) => void;
}

/**
 * SimilarListings widget displays related property listings
 * in a responsive grid layout with horizontal scrolling on mobile
 */
export function SimilarListings({ propertyId, onPropertyClick }: SimilarListingsProps) {
  const t = useTranslations('PropertyDetail');
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();

  // Fetch similar listings from API
  const { data, isLoading, isError } = useQuery({
    ...listingQueries.similar(propertyId ?? '', 5),
    enabled: !!propertyId,
    select: (response) => response.payload.data.listings,
  });

  const handleToggleFavorite = async (id: string) => {
    // Determine current favorite status
    const listing = listings.find((l) => l.id === id);
    const isCurrentlyFavorite = favoriteOverrides[id] ?? listing?.isFavorite ?? false;
    const nextFavorite = !isCurrentlyFavorite;

    // Optimistic update
    setFavoriteOverrides((prev) => ({ ...prev, [id]: nextFavorite }));

    try {
      await bookmarkApi.toggleBookmark(id);
      // Synchronize other components (like heart icon in header or search results)
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      // Track behavior
      behaviorTracker.trackBookmark(id, nextFavorite ? 'add' : 'remove');
    } catch (error) {
      console.error('[SimilarListings] Failed to toggle favorite:', error);
      // Revert on failure
      setFavoriteOverrides((prev) => ({ ...prev, [id]: isCurrentlyFavorite }));
    }
  };

  const handlePropertyClick = (slug: string, listingId: string) => {
    behaviorTracker.trackClick(listingId, { source_page: 'similar' });
    if (onPropertyClick) {
      onPropertyClick(slug);
    } else {
      router.push(buildListingDetailUrl(locale, slug));
    }
  };

  // Map API listings to card props
  const listings: SimilarListingCardProps[] = data ? mapSimilarListingsToCardProps(data) : [];

  // Don't render if no propertyId
  if (!propertyId) {
    return null;
  }

  return (
    <div className='bg-primary/5 w-full py-12 sm:py-16'>
      <div className='max-w-[1200px] mx-auto px-10 sm:px-14'>
        {/* Section Title */}
        <h2 className='text-foreground text-xl sm:text-2xl font-bold leading-[1.5] tracking-[-0.24px] mb-6 sm:mb-8'>
          {t('similarListings')}
        </h2>

        {/* Loading State */}
        {isLoading && (
          <Carousel opts={{ align: 'start' }}>
            <CarouselContent>
              {[1, 2, 3].map((i) => (
                <CarouselItem key={i} className='basis-full sm:basis-1/2 lg:basis-1/3'>
                  <div className='rounded-lg border-[1.5px] border-primary/10 bg-background p-6 h-full'>
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
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}

        {/* Error State */}
        {isError && (
          <div className='flex items-center justify-center gap-2 text-red-500 py-8'>
            <AlertCircle className='h-5 w-5' />
            <p>{t('failedToLoadSimilarListings') || 'Failed to load similar listings'}</p>
          </div>
        )}

        {/* Listings Slider */}
        {!isLoading && !isError && listings.length > 0 && (
          <Carousel opts={{ align: 'start' }} className='relative'>
            <CarouselContent>
              {listings.map((property) => (
                <CarouselItem key={property.id} className='basis-full sm:basis-1/2 lg:basis-1/3'>
                  <RealVistaListingCard
                    {...property}
                    isFavorite={favoriteOverrides[property.id] ?? property.isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={() => handlePropertyClick(property.slug, property.id)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className='-left-6 sm:-left-8' />
            <CarouselNext className='-right-6 sm:-right-8' />
          </Carousel>
        )}

        {/* Empty State */}
        {!isLoading && !isError && listings.length === 0 && (
          <div className='text-center py-12 text-muted-foreground'>
            <p>{t('noSimilarListings') || 'No similar listings found'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
