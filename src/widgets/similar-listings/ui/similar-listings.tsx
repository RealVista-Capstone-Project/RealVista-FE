'use client';

import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  listingQueries,
  mapSimilarListingsToCardProps,
  type SimilarListingCardProps,
} from '@/entities/listing';
import { Skeleton } from '@/shared/ui/skeleton/skeleton';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const router = useRouter();
  const locale = useLocale();

  // Fetch similar listings from API
  const { data, isLoading, isError } = useQuery({
    ...listingQueries.similar(propertyId ?? '', 5),
    enabled: !!propertyId,
    select: (response) => response.payload.data.listings,
  });

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const handlePropertyClick = (id: string) => {
    if (onPropertyClick) {
      onPropertyClick(id);
    } else {
      router.push(`/${locale}/listing/${id}`);
    }
  };

  // Map API listings to card props
  const listings: SimilarListingCardProps[] = data ? mapSimilarListingsToCardProps(data) : [];

  // Don't render if no propertyId
  if (!propertyId) {
    return null;
  }

  return (
    <div className='bg-purple-98 w-full py-12 sm:py-16'>
      <div className='max-w-[1200px] mx-auto px-4 sm:px-6'>
        {/* Section Title */}
        <h2 className='text-main-black text-xl sm:text-2xl font-bold leading-[1.5] tracking-[-0.24px] mb-6 sm:mb-8'>
          {t('similarListings')}
        </h2>

        {/* Loading State */}
        {isLoading && (
          <div className='flex gap-6 sm:gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='w-[280px] sm:w-auto flex-shrink-0 sm:flex-shrink h-full'>
                <div className='rounded-lg border-[1.5px] border-purple-96 bg-white p-6 h-full'>
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
            <p>{t('failedToLoadSimilarListings') || 'Failed to load similar listings'}</p>
          </div>
        )}

        {/* Listings Grid - Mobile: Horizontal scroll, Desktop: 3 column grid */}
        {!isLoading && !isError && listings.length > 0 && (
          <div className='overflow-x-auto sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0'>
            <div className='flex gap-6 sm:gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-3 min-w-min sm:min-w-0'>
              {listings.map((property) => {
                // Exclude slug from props passed to RealVistaListingCard
                const {...cardProps } = property;
                return (
                  <div
                    key={property.id}
                    className='w-[280px] sm:w-auto flex-shrink-0 sm:flex-shrink h-full'
                  >
                    <RealVistaListingCard
                      {...cardProps}
                      isFavorite={favorites.has(property.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onClick={() => handlePropertyClick(property.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && listings.length === 0 && (
          <div className='text-center py-12 text-grey-500'>
            <p>{t('noSimilarListings') || 'No similar listings found'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
