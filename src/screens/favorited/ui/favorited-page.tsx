'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Heart } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pagination } from '@/shared/ui/realvista-pagination';
import { BookmarkCardContainer } from './bookmark-card-container';
import {
  BookmarksFilter,
  allTypeCodes,
  type SortOrder,
  type ListingTypeFilter,
  type PropertyTypeFilter,
} from './bookmarks-filter';
import {
  bookmarkApi,
  bookmarkKeys,
  bookmarkQueries,
  type GetBookmarksParams,
} from '@/entities/bookmark';
import { type ListingSearchResponse } from '@/shared/types/search';
import { ROUTES } from '@/shared/config/routes';

const ITEMS_PER_PAGE = 12;

function listingStatusIsSold(status: string | undefined) {
  return status?.toUpperCase() === 'SOLD';
}

function listingStatusIsRented(status: string | undefined) {
  return status?.toUpperCase() === 'RENTED';
}

/**
 * Transforms a bookmark listing DTO to card props format
 */
function mapBookmarkListingToCardProps(item: ListingSearchResponse) {
  return {
    id: item.listing_id,
    slug: item.slug,
    image: item.thumbnail ?? '',
    title: item.name,
    address: item.full_address,
    price: item.price,
    listingType: item.listing_type,
    isFavorite: true,
    statusTag: listingStatusIsSold(item.status)
      ? ('SOLD' as const)
      : listingStatusIsRented(item.status)
        ? ('RENTED' as const)
        : undefined,
    attributes: item.attributes,
    boostTags: item.boost_packages,
    userType: item.user_type as any,
  };
}

export function FavoritedPage() {
  const t = useTranslations('Favorited');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [listingType, setListingType] = useState<ListingTypeFilter>('buy');
  const [propertyType, setPropertyType] = useState<PropertyTypeFilter>([...allTypeCodes]);
  const [compareSelectedIds, setCompareSelectedIds] = useState<string[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const isAllSelected = propertyType.length === allTypeCodes.length;

  const apiParams: GetBookmarksParams = {
    propertyTypes: propertyType.length > 0 && !isAllSelected ? propertyType : undefined,
    listingType: listingType === 'buy' ? 'SALE' : 'RENT',
    sortDirection: sortOrder === 'oldest' ? 'OLDEST' : 'NEWEST',
    page: currentPage - 1,
    size: ITEMS_PER_PAGE,
  };

  const { data, isLoading } = useQuery(bookmarkQueries.list(apiParams));

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: (listingId: string) => bookmarkApi.toggleBookmark(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
    },
  });

  const bookmarkPage = data?.payload?.data;
  const items = bookmarkPage?.content ?? [];
  const totalPages = bookmarkPage?.total_pages ?? 0;

  useEffect(() => {
    const soldIds = new Set(
      items.filter((i) => listingStatusIsSold(i.status)).map((i) => i.listing_id)
    );
    if (soldIds.size === 0) return;
    setCompareSelectedIds((prev) => {
      const next = prev.filter((id) => !soldIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [items]);

  const resetPage = () => setCurrentPage(1);

  const exitCompareMode = () => {
    setCompareSelectedIds([]);
    setIsCompareMode(false);
  };

  const handleStartCompareMode = () => setIsCompareMode(true);

  const handleCompareSelectionChange = (id: string, selected: boolean) => {
    const row = items.find((i) => i.listing_id === id);
    if (row && listingStatusIsSold(row.status)) return;

    setCompareSelectedIds((prev) => {
      if (!selected) return prev.filter((x) => x !== id);
      if (prev.includes(id)) return prev;
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleCompareNavigate = () => {
    if (compareSelectedIds.length !== 2) return;
    const q = compareSelectedIds.join(',');
    router.push(`/${locale}${ROUTES.compare}?ids=${encodeURIComponent(q)}`);
  };

  const handlePageChange = (page: number) => {
    exitCompareMode();
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortOrderChange = (sort: SortOrder) => {
    exitCompareMode();
    setSortOrder(sort);
    resetPage();
  };

  const handleListingTypeChange = (type: ListingTypeFilter) => {
    exitCompareMode();
    setListingType(type);
    resetPage();
  };

  const handlePropertyTypeChange = (types: PropertyTypeFilter) => {
    exitCompareMode();
    setPropertyType(types);
    resetPage();
  };

  return (
    <div className='min-h-screen bg-white'>
      {/* Filter Section */}
      <BookmarksFilter
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
        listingType={listingType}
        onListingTypeChange={handleListingTypeChange}
        propertyType={propertyType}
        onPropertyTypeChange={handlePropertyTypeChange}
        compareSelectedCount={compareSelectedIds.length}
        isCompareEnabled={compareSelectedIds.length === 2}
        onCompareClick={handleCompareNavigate}
        isCompareMode={isCompareMode}
        onStartCompareMode={handleStartCompareMode}
        onCancelCompareMode={exitCompareMode}
      />

      {/* Results Section */}
      <section className='px-6 pb-12 pt-8 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {isLoading ? (
            <div className='flex justify-center py-16'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
            </div>
          ) : items.length === 0 ? (
            // Empty State
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-white py-16 px-6'>
              <Heart className='mb-4 h-12 w-12 text-muted-foreground/60' strokeWidth={1.5} />
              <h2 className='mb-2 text-lg font-bold text-foreground'>{t('emptyTitle')}</h2>
              <p className='mb-6 max-w-md text-center text-sm text-muted-foreground'>
                {t('emptyDescription')}
              </p>
              <Link
                href={`/${locale}${ROUTES.buy}`}
                className='inline-block rounded-lg bg-primary px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-primary/90'
              >
                {t('browseListing')}
              </Link>
            </div>
          ) : (
            <>
              {/* Property Grid */}
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {items.map((item) => {
                  const cardProps = mapBookmarkListingToCardProps(item);
                  return (
                    <BookmarkCardContainer
                      key={item.listing_id}
                      {...cardProps}
                      isSelectionMode={isCompareMode}
                      isSelected={compareSelectedIds.includes(item.listing_id)}
                      compareUnavailable={listingStatusIsSold(item.status)}
                      compareSelectDisabled={
                        compareSelectedIds.length >= 2 &&
                        !compareSelectedIds.includes(item.listing_id)
                      }
                      onSelectionChange={handleCompareSelectionChange}
                      onToggleFavorite={(id) => toggleBookmark(id)}
                      onClick={() => router.push(`/${locale}/listing/${cardProps.slug || cardProps.id}`)}
                    />
                  );
                })}
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
