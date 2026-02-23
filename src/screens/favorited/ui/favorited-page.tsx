'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Heart } from 'lucide-react';
import { Pagination } from '@/shared/ui/realvista-pagination';
import { BookmarkCardContainer } from './bookmark-card-container';
import {
  BookmarksFilter,
  type SortOrder,
  type ListingTypeFilter,
  type PropertyTypeFilter,
} from './bookmarks-filter';
import { mockProperties } from '@/entities/property';

export function FavoritedPage() {
  const t = useTranslations('Favorited');
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>(mockProperties.map((p) => p.id));
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [listingType, setListingType] = useState<ListingTypeFilter>('buy');
  const [propertyType, setPropertyType] = useState<PropertyTypeFilter>('all');
  const itemsPerPage = 9;

  // Get favorited properties
  let favoritedProperties = mockProperties.filter((p) => favorites.includes(p.id));

  // Apply filters
  if (listingType !== 'all') {
    favoritedProperties = favoritedProperties.filter((p) => {
      if (listingType === 'buy') return !p.id.includes('rent');
      if (listingType === 'rent') return p.id.includes('rent');
      return true;
    });
  }

  // Apply sorting
  const sortedProperties = [...favoritedProperties].sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.id.localeCompare(a.id);
    }
    if (sortOrder === 'oldest') {
      return a.id.localeCompare(b.id);
    }
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = sortedProperties.slice(startIndex, endIndex);

  // Handle remove from favorites
  const handleRemoveFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((favId) => favId !== id));
    if (currentPage > 1 && startIndex >= sortedProperties.length - 1) {
      setCurrentPage(1);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className='min-h-screen bg-purple-98'>
      {/* Filter Section */}
      <BookmarksFilter
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        listingType={listingType}
        onListingTypeChange={setListingType}
        propertyType={propertyType}
        onPropertyTypeChange={setPropertyType}
      />

      {/* Results Section */}
      <section className='px-6 pb-12 pt-8 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {favoritedProperties.length === 0 ? (
            // Empty State
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-92 bg-white py-16 px-6'>
              <Heart className='mb-4 h-12 w-12 text-grey-400' strokeWidth={1.5} />
              <h2 className='mb-2 text-lg font-bold text-main-black'>{t('emptyTitle')}</h2>
              <p className='mb-6 max-w-md text-center text-sm text-grey-600'>
                {t('emptyDescription')}
              </p>
              <Link
                href={`/${locale}/`}
                className='inline-block rounded-lg bg-main-primary px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-main-primary/90'
              >
                {t('browseListing')}
              </Link>
            </div>
          ) : (
            <>
              {/* Property Grid */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {currentProperties.map((property) => (
                  <BookmarkCardContainer
                    key={property.id}
                    {...property}
                    isFavorite={favorites.includes(property.id)}
                    onToggleFavorite={(id) => handleRemoveFavorite(id)}
                    onClick={(id: string) => console.log('Property clicked:', id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='mt-12'>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default FavoritedPage;
