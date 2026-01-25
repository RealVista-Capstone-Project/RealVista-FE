'use client';

import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { mockSimilarProperties } from '../model/mock-similar-properties';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export interface SimilarListingsProps {
  propertyId?: string;
  onPropertyClick?: (propertyId: string) => void;
}

/**
 * SimilarListings widget displays related property listings
 * in a responsive grid layout with horizontal scrolling on mobile
 */
export function SimilarListings({ propertyId, onPropertyClick }: SimilarListingsProps) {
  const t = useTranslations('PropertyDetail');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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
      // Default: navigate to property detail
      window.location.href = `/listing/${id}`;
    }
  };

  return (
    <div className='bg-purple-98 w-full py-12 sm:py-16'>
      <div className='max-w-[1200px] mx-auto px-4 sm:px-6'>
        {/* Section Title */}
        <h2 className='text-main-black text-xl sm:text-2xl font-bold leading-[1.5] tracking-[-0.24px] mb-6 sm:mb-8'>
          {t('similarListings')}
        </h2>

        {/* Listings Grid - Mobile: Horizontal scroll, Desktop: 3 column grid */}
        <div className='overflow-x-auto sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0'>
          <div className='flex gap-6 sm:gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-3 min-w-min sm:min-w-0'>
            {mockSimilarProperties.map((property) => (
              <div key={property.id} className='w-[280px] sm:w-auto flex-shrink-0 sm:flex-shrink'>
                <RealVistaListingCard
                  {...property}
                  isFavorite={favorites.has(property.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={handlePropertyClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}