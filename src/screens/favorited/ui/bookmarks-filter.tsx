'use client';

import { useState } from 'react';
import { Search, X, ChevronDown, Ban } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/shared/lib/utils';

export type SortOrder = 'newest' | 'oldest';
export type ListingTypeFilter = 'all' | 'rent' | 'buy';
export type PropertyTypeFilter = 'all' | 'apartment' | 'house' | 'townhouse' | 'condo' | 'land';

interface BookmarksFilterProps {
  sortOrder: SortOrder;
  onSortOrderChange: (sort: SortOrder) => void;
  listingType: ListingTypeFilter;
  onListingTypeChange: (type: ListingTypeFilter) => void;
  propertyType: PropertyTypeFilter;
  onPropertyTypeChange: (type: PropertyTypeFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect?: () => void;
  onCancel?: () => void;
  hasListings?: boolean;
  isSelectionMode?: boolean;
}

export function BookmarksFilter({
  sortOrder,
  onSortOrderChange,
  listingType,
  onListingTypeChange,
  propertyType,
  onPropertyTypeChange,
  searchQuery,
  onSearchChange,
  onSelect,
  onCancel,
  hasListings = true,
  isSelectionMode = false,
}: BookmarksFilterProps) {
  const t = useTranslations('Favorited');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [listingTypeOpen, setListingTypeOpen] = useState(false);
  const [isCategorySelected, setIsCategorySelected] = useState(false);
  const [isSortSelected, setIsSortSelected] = useState(false);

  const getCategoryLabel = () => {
    if (!isCategorySelected) return t('byCategory');
    const labels: Record<PropertyTypeFilter, string> = {
      all: t('all'),
      apartment: t('apartment'),
      house: t('house'),
      townhouse: t('townhouse'),
      condo: t('condo'),
      land: t('land'),
    };
    return labels[propertyType];
  };

  const getSortLabel = () => {
    if (!isSortSelected) return t('byDateAdded');
    return sortOrder === 'newest' ? t('newest') : t('oldest');
  };

  const getListingTypeLabel = () => {
    if (listingType === 'all') return 'Showing all';
    return listingType === 'buy' ? t('buy') : t('rent');
  };
  return (
    <section className='px-6 py-4 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl'>
        {/* Filter Bar */}
        <div className='flex items-center gap-4 rounded-lg border border-grey-96 bg-white'>
          {/* Left: Listing Type Dropdown */}
          <PopoverPrimitive.Root open={listingTypeOpen} onOpenChange={setListingTypeOpen}>
            <PopoverPrimitive.Trigger asChild>
              <button
                type='button'
                className='flex items-center gap-2 border-r border-grey-96 rounded-l-lg bg-white px-6 py-4 text-sm font-medium text-main-black transition-colors hover:bg-grey-98'
                aria-label='Listing type filter'
              >
                {getListingTypeLabel()}
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', listingTypeOpen && 'rotate-180')}
                  strokeWidth={2}
                />
              </button>
            </PopoverPrimitive.Trigger>

            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                align='start'
                sideOffset={8}
                className='z-50 w-[150px] rounded-lg border border-purple-92 bg-white p-0 shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]'
              >
                <div className='flex flex-col py-1'>
                  {[
                    { value: 'all' as ListingTypeFilter, label: 'Showing all' },
                    { value: 'buy' as ListingTypeFilter, label: t('buy') },
                    { value: 'rent' as ListingTypeFilter, label: t('rent') },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onListingTypeChange(option.value);
                        setListingTypeOpen(false);
                      }}
                      className={cn(
                        'px-4 py-2.5 text-left text-sm font-medium transition-colors',
                        listingType === option.value
                          ? 'bg-main-primary text-white'
                          : 'text-main-black hover:bg-purple-98'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>

          {/* Middle: Search Input */}
          <div className='flex-1 flex items-center bg-white px-3 py-2'>
            <Search className='h-4 w-4 text-grey-500 mr-2 flex-shrink-0' strokeWidth={2} />
            <input
              type='text'
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className='w-full bg-transparent text-sm text-main-black placeholder-grey-500 outline-none'
            />
          </div>

          {/* Right: Sort and Category Dropdowns */}
          <div className='flex items-center gap-3 px-4'>
            {/* Sort Dropdown */}
            <PopoverPrimitive.Root open={sortOpen} onOpenChange={setSortOpen}>
              <PopoverPrimitive.Trigger asChild>
                <button
                  type='button'
                  className='flex items-center gap-2 rounded-lg border border-grey-96 bg-white px-3 py-2 text-sm font-medium text-main-black transition-colors hover:bg-grey-98'
                  aria-label='Sort filter'
                >
                  {getSortLabel()}
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', sortOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                </button>
              </PopoverPrimitive.Trigger>

              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  align='end'
                  sideOffset={8}
                  className='z-50 w-[200px] rounded-lg border border-purple-92 bg-white p-0 shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]'
                >
                  <div className='flex flex-col py-1'>
                    {[
                      { value: 'newest' as SortOrder, label: t('newest') },
                      { value: 'oldest' as SortOrder, label: t('oldest') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortOrderChange(option.value);
                          setIsSortSelected(true);
                          setSortOpen(false);
                        }}
                        className={cn(
                          'px-4 py-2.5 text-left text-sm font-medium transition-colors',
                          sortOrder === option.value
                            ? 'bg-main-primary text-white'
                            : 'text-main-black hover:bg-purple-98'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>

            {/* Category Dropdown */}
            <PopoverPrimitive.Root open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverPrimitive.Trigger asChild>
                <button
                  type='button'
                  className='flex items-center gap-2 rounded-lg border border-grey-96 bg-white px-3 py-2 text-sm font-medium text-main-black transition-colors hover:bg-grey-98'
                  aria-label='Category filter'
                >
                  {getCategoryLabel()}
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', categoryOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                </button>
              </PopoverPrimitive.Trigger>

              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  align='end'
                  sideOffset={8}
                  className='z-50 w-[200px] rounded-lg border border-purple-92 bg-white p-0 shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]'
                >
                  <div className='flex flex-col py-1'>
                    {[
                      { value: 'all' as PropertyTypeFilter, label: t('all') },
                      { value: 'apartment' as PropertyTypeFilter, label: t('apartment') },
                      { value: 'house' as PropertyTypeFilter, label: t('house') },
                      { value: 'townhouse' as PropertyTypeFilter, label: t('townhouse') },
                      { value: 'condo' as PropertyTypeFilter, label: t('condo') },
                      { value: 'land' as PropertyTypeFilter, label: t('land') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onPropertyTypeChange(option.value);
                          setIsCategorySelected(true);
                          setCategoryOpen(false);
                        }}
                        className={cn(
                          'px-4 py-2.5 text-left text-sm font-medium transition-colors',
                          propertyType === option.value
                            ? 'bg-main-primary text-white'
                            : 'text-main-black hover:bg-purple-98'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>

            {/* Select/Remove Buttons */}
            {onSelect &&
              (isSelectionMode ? (
                <div className='flex items-center gap-2'>
                  <button
                    onClick={onSelect}
                    className='flex items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50'
                  >
                    <X className='h-4 w-4' strokeWidth={2} />
                    {t('remove')}
                  </button>
                  <button
                    onClick={onCancel}
                    className='flex items-center justify-center gap-2 rounded-lg border border-grey-92 bg-white px-4 py-2 text-sm font-medium text-main-black transition-colors hover:bg-grey-96'
                  >
                    <Ban className='h-4 w-4' strokeWidth={2} />
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSelect}
                  disabled={!hasListings && !isSelectionMode}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    hasListings || isSelectionMode
                      ? 'border-main-primary bg-main-primary text-white hover:bg-main-primary-hover'
                      : 'border-grey-92 bg-grey-98 text-grey-400 cursor-not-allowed'
                  }`}
                >
                  {t('select')}
                </button>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
