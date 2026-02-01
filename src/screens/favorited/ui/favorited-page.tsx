'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Heart } from 'lucide-react';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { Pagination } from '@/shared/ui/realvista-pagination';
import { BookmarkCardContainer } from './bookmark-card-container';
import {
  BookmarksFilter,
  type SortOrder,
  type ListingTypeFilter,
  type PropertyTypeFilter,
} from './bookmarks-filter';
import { mockProperties } from '@/entities/property';
import type { PropertyListingCardType } from '@/entities/property/model/types';

export function FavoritedPage() {
  const t = useTranslations('Favorited');
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>(mockProperties.map((p) => p.id));
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [listingType, setListingType] = useState<ListingTypeFilter>('buy');
  const [propertyType, setPropertyType] = useState<PropertyTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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

  // Apply search
  if (searchQuery) {
    favoritedProperties = favoritedProperties.filter((p) =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle remove from favorites
  const handleRemoveFavorite = (id: string) => {
    if (isSelectionMode) {
      // In selection mode, toggle selection
      const newSelected = new Set(selectedItems);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedItems(newSelected);
    } else {
      // Normal mode - remove immediately
      setFavorites((prev) => prev.filter((favId) => favId !== id));
      // Reset to first page if current page is now empty
      if (currentPage > 1 && startIndex >= sortedProperties.length - 1) {
        setCurrentPage(1);
      }
    }
  };

  // Handle select button click
  const handleSelectClick = () => {
    if (isSelectionMode && selectedItems.size > 0) {
      // In selection mode with items selected - show remove confirmation
      setShowConfirmDialog(true);
    } else {
      // Enter selection mode
      setIsSelectionMode(!isSelectionMode);
      if (!isSelectionMode) {
        setSelectedItems(new Set());
      }
    }
  };

  // Handle cancel selection
  const handleCancel = () => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  };

  // Handle confirm remove selected
  const handleConfirmRemove = () => {
    setFavorites((prev) => prev.filter((id) => !selectedItems.has(id)));
    setSelectedItems(new Set());
    setIsSelectionMode(false);
    setShowConfirmDialog(false);
    setCurrentPage(1);
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
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSelect={handleSelectClick}
        onCancel={handleCancel}
        hasListings={favoritedProperties.length > 0}
        isSelectionMode={isSelectionMode}
        selectedCount={selectedItems.size}
      />

      {/* Results Section */}
      <section className='px-6 pb-12 pt-8 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {currentProperties.length === 0 && searchQuery ? (
            // No results for search
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-92 bg-white py-16 px-6'>
              <Heart className='mb-4 h-12 w-12 text-grey-400' strokeWidth={1.5} />
              <h2 className='mb-2 text-lg font-bold text-main-black'>{t('noResults')}</h2>
              <p className='text-center text-sm text-grey-600'>
                {t('noSearchResults', { defaultValue: `No bookmarks match "${searchQuery}"` })}
              </p>
            </div>
          ) : favoritedProperties.length === 0 ? (
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
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedItems.has(property.id)}
                    onSelectionChange={(id, isSelected) => {
                      const newSelected = new Set(selectedItems);
                      if (isSelected) {
                        newSelected.add(id);
                      } else {
                        newSelected.delete(id);
                      }
                      setSelectedItems(newSelected);
                    }}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='w-96 rounded-lg bg-white p-6 shadow-lg'>
            <h2 className='mb-2 text-lg font-bold text-main-black'>{t('confirmRemoveTitle')}</h2>
            <p className='mb-6 text-sm text-grey-600'>
              {t('confirmRemoveMessage', {
                count: selectedItems.size,
              })}
            </p>
            <div className='flex justify-end gap-3'>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className='rounded-lg border border-purple-92 bg-white px-4 py-2 text-sm font-medium text-main-black transition-colors hover:bg-purple-98'
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmRemove}
                className='rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600'
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FavoritedPage;
