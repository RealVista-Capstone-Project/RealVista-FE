'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/shared/ui/button/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  RealVistaListingCard,
  type ListingAttribute,
} from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { Pagination } from '@/shared/ui/realvista-pagination';
import type { PropertyListingDto } from '@/entities/property';

export interface SearchListingResultsProps {
  properties: PropertyListingDto[];
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  selectedPropertyIds: string[];
  favoriteOverrides: Record<string, boolean>;
  currentPage: number;
  totalPages: number;
  locale: string;
  listingType?: 'RENT' | 'SALE';
  onHoverProperty: (ids: string[]) => void;
  onSelectProperty: (ids: string[]) => void;
  onToggleFavorite: (id: string) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export const SearchListingResults = memo(function SearchListingResults({
  properties,
  isLoading,
  viewMode,
  selectedPropertyIds,
  favoriteOverrides,
  currentPage,
  totalPages,
  locale,
  listingType,
  onHoverProperty,
  onSelectProperty,
  onToggleFavorite,
  onPageChange,
  onResetFilters,
}: SearchListingResultsProps) {
  const router = useRouter();

  return (
    <>
      {/* Property Grid/List */}
      <div id='property-listings-top' />
      <div
        className={`mt-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'flex flex-col gap-4'}`}
      >
        {isLoading ? (
          <div className='col-span-full grid grid-cols-1 md:grid-cols-2 gap-6'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='flex flex-col gap-3 rounded-2xl border border-primary/20 bg-white p-3'>
                <Skeleton className='aspect-[4/3] w-full rounded-xl' />
                <div className='space-y-2 px-1'>
                  <Skeleton className='h-6 w-3/4' />
                  <Skeleton className='h-4 w-1/2' />
                  <div className='flex gap-2 pt-2'>
                    <Skeleton className='h-8 w-20 rounded-full' />
                    <Skeleton className='h-8 w-20 rounded-full' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className='col-span-full flex flex-col items-center justify-center py-20 text-center opacity-60'>
            <div className='mb-4 rounded-full bg-primary/5 p-6'>
              <Search className='h-10 w-10 text-primary' />
            </div>
            <h3 className='text-xl font-bold text-foreground'>Không tìm thấy kết quả</h3>
            <p className='text-muted-foreground'>Thử thay đổi bộ lọc hoặc vùng tìm kiếm của bạn</p>
            <Button variant='link' onClick={onResetFilters} className='mt-2 text-primary font-bold'>Xóa tất cả bộ lọc</Button>
          </div>
        ) : (
          properties.map((property: PropertyListingDto) => (
            <div
              key={property.listing_id}
              id={`property-${property.listing_id}`}
              onMouseEnter={() => onHoverProperty([property.listing_id])}
              onMouseLeave={() => onHoverProperty([])}
              onClick={() => onSelectProperty([property.listing_id])}
            >
              <RealVistaListingCard
                id={property.listing_id}
                title={property.name}
                address={property.full_address}
                price={property.price}
                image={property.thumbnail ?? ''}
                attributes={property.attributes as ListingAttribute[]}
                areaUnit='m²'
                isFavorite={favoriteOverrides[property.listing_id] ?? property.is_favorite}
                boostTags={property.is_boosted ? property.boost_packages : undefined}
                userType={property.user_type as 'AGENT' | 'OWNER'}
                variant={viewMode}
                listingType={listingType}
                onToggleFavorite={onToggleFavorite}
                onClick={() =>
                  router.push(`/${locale}/listing/${property.slug || property.listing_id}`)
                }
                className={
                  selectedPropertyIds.includes(property.listing_id)
                    ? 'ring-2 ring-primary'
                    : ''
                }
              />
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-8 pb-4'>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
});
