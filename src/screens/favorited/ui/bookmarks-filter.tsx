'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
  onCompare?: () => void;
}

export function BookmarksFilter({
  sortOrder,
  onSortOrderChange,
  listingType,
  onListingTypeChange,
  propertyType,
  onPropertyTypeChange,
  onCompare,
}: BookmarksFilterProps) {
  const t = useTranslations('Favorited');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [listingTypeOpen, setListingTypeOpen] = useState(false);

  const getCategoryLabel = () => {
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
    return sortOrder === 'newest' ? t('newest') : t('oldest');
  };

  const getListingTypeLabel = () => {
    if (listingType === 'all') return 'Showing all';
    return listingType === 'buy' ? t('buy') : t('rent');
  };

  const dropdownButtonClass =
    'flex items-center gap-2 rounded-lg border border-grey-96 bg-white px-3 py-2 text-sm font-medium text-main-black transition-colors hover:bg-grey-98';

  return (
    <section className='pt-10 px-6 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex items-center justify-between gap-4'>
          {/* Left: All Dropdowns */}
          <div className='flex items-center gap-3'>
            {/* Listing Type Dropdown */}
            <PopoverPrimitive.Root open={listingTypeOpen} onOpenChange={setListingTypeOpen}>
              <PopoverPrimitive.Trigger asChild>
                <button
                  type='button'
                  className={dropdownButtonClass}
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
                  className='z-50 w-[150px] overflow-hidden rounded-lg border border-purple-92 bg-white p-0 shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]'
                >
                  <div className='flex flex-col'>
                    {[
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

            {/* Sort Dropdown */}
            <PopoverPrimitive.Root open={sortOpen} onOpenChange={setSortOpen}>
              <PopoverPrimitive.Trigger asChild>
                <button type='button' className={dropdownButtonClass} aria-label='Sort filter'>
                  {getSortLabel()}
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', sortOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                </button>
              </PopoverPrimitive.Trigger>

              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  align='start'
                  sideOffset={8}
                  className='z-50 w-[200px] overflow-hidden rounded-lg border border-purple-92 bg-white p-0 shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]'
                >
                  <div className='flex flex-col'>
                    {[
                      { value: 'newest' as SortOrder, label: t('newest') },
                      { value: 'oldest' as SortOrder, label: t('oldest') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortOrderChange(option.value);
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
                <button type='button' className={dropdownButtonClass} aria-label='Category filter'>
                  {getCategoryLabel()}
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', categoryOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                </button>
              </PopoverPrimitive.Trigger>

              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  align='start'
                  sideOffset={8}
                  className='z-50 w-[200px] overflow-hidden rounded-lg border border-purple-92 bg-white p-0 shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]'
                >
                  <div className='flex flex-col'>
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
          </div>

          {/* Right: So sánh Button */}
          <button
            type='button'
            onClick={onCompare}
            className='flex items-center gap-2 rounded-lg border border-main-primary bg-main-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-main-primary-hover'
          >
            So sánh
          </button>
        </div>
      </div>
    </section>
  );
}
