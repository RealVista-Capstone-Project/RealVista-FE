'use client';

import { useState } from 'react';
import { Check, ChevronDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/shared/lib/utils';
import { PROPERTY_TYPES } from '@/shared/config/property-types';

export type SortOrder = 'newest' | 'oldest';
export type ListingTypeFilter = 'rent' | 'buy';
export type PropertyTypeFilter = string[]; // array of selected type codes, empty = all

interface BookmarksFilterProps {
  sortOrder: SortOrder;
  onSortOrderChange: (sort: SortOrder) => void;
  listingType: ListingTypeFilter;
  onListingTypeChange: (type: ListingTypeFilter) => void;
  propertyType: PropertyTypeFilter;
  onPropertyTypeChange: (types: PropertyTypeFilter) => void;
  onCompare?: () => void;
}

export const allTypeCodes = PROPERTY_TYPES.flatMap((cat) => cat.types.map((t) => t.code));

function CheckboxIcon({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  return (
    <div
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
        checked || indeterminate
          ? 'border-main-primary bg-main-primary'
          : 'border-grey-400 bg-white'
      )}
    >
      {indeterminate ? (
        <Minus className='h-3 w-3 text-white' strokeWidth={2.5} />
      ) : checked ? (
        <Check className='h-3 w-3 text-white' strokeWidth={2.5} />
      ) : null}
    </div>
  );
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

  const isAllSelected = propertyType.length === allTypeCodes.length;

  const isCategoryFullyChecked = (catCode: string) => {
    const cat = PROPERTY_TYPES.find((c) => c.code === catCode);
    if (!cat) return false;
    return cat.types.every((t) => propertyType.includes(t.code));
  };

  const isCategoryPartiallyChecked = (catCode: string) => {
    const cat = PROPERTY_TYPES.find((c) => c.code === catCode);
    if (!cat) return false;
    const someChecked = cat.types.some((t) => propertyType.includes(t.code));
    return someChecked && !isCategoryFullyChecked(catCode);
  };

  const toggleAll = () => {
    onPropertyTypeChange(isAllSelected ? [] : [...allTypeCodes]);
  };

  const toggleCategory = (catCode: string) => {
    const cat = PROPERTY_TYPES.find((c) => c.code === catCode);
    if (!cat) return;
    const catTypeCodes = cat.types.map((t) => t.code);
    const fullyChecked = isCategoryFullyChecked(catCode);
    let next: string[];
    if (fullyChecked) {
      next = propertyType.filter((code) => !catTypeCodes.includes(code));
    } else {
      next = [...new Set([...propertyType, ...catTypeCodes])];
    }
    // if everything ends up selected, normalize to allTypeCodes
    onPropertyTypeChange(next.length === allTypeCodes.length ? [...allTypeCodes] : next);
  };

  const toggleType = (typeCode: string) => {
    let next: string[];
    if (propertyType.includes(typeCode)) {
      next = propertyType.filter((c) => c !== typeCode);
    } else {
      next = [...propertyType, typeCode];
    }
    onPropertyTypeChange(next.length === allTypeCodes.length ? [] : next);
  };

  const getCategoryLabel = () => {
    if (isAllSelected || propertyType.length === 0) return t('allProperties');
    if (propertyType.length === 1) {
      for (const cat of PROPERTY_TYPES) {
        const found = cat.types.find((t) => t.code === propertyType[0]);
        if (found) return found.label;
      }
    }
    return t('selectedTypes', { count: propertyType.length });
  };

  const getSortLabel = () =>
    sortOrder === 'newest' ? t('newest') : t('oldest');

  const dropdownButtonClass =
    'flex items-center gap-2 rounded-lg border border-grey-96 bg-white px-3 py-2 text-sm font-medium text-main-black transition-colors hover:bg-grey-98';

  return (
    <section className='pt-10 px-6 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex items-center justify-between gap-4 rounded-lg bg-white px-6 py-4 shadow-sm'>
          {/* Left: Tabs + Dropdowns */}
          <div className='flex items-center gap-4'>
            {/* Listing Type Tabs */}
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => onListingTypeChange('rent')}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  listingType === 'rent'
                    ? 'bg-main-primary text-white'
                    : 'text-grey-600 hover:bg-grey-98'
                )}
              >
                {t('rent')}
              </button>
              <button
                type='button'
                onClick={() => onListingTypeChange('buy')}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  listingType === 'buy'
                    ? 'bg-main-primary text-white'
                    : 'text-grey-600 hover:bg-grey-98'
                )}
              >
                {t('buy')}
              </button>
            </div>

            {/* Sort By Dropdown */}
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-grey-600'>{t('sortBy')}</span>
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
            </div>

            {/* Property Dropdown */}
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-grey-600'>{t('property')}</span>
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
                    className='z-50 w-[260px] overflow-hidden rounded-lg border border-purple-92 bg-white p-0 shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]'
                  >
                    <div className='flex flex-col max-h-[400px] overflow-y-auto'>
                      {/* Tất cả */}
                      <button
                        type='button'
                        onClick={toggleAll}
                        className='flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-main-black hover:bg-purple-98 transition-colors'
                        aria-label={t('allTypes')}
                      >
                        <CheckboxIcon checked={isAllSelected} />
                        {t('allTypes')}
                      </button>

                      {/* Categories + Types */}
                      {PROPERTY_TYPES.map((cat) => (
                        <div key={cat.code}>
                          {/* Category row */}
                          <button
                            type='button'
                            onClick={() => toggleCategory(cat.code)}
                            className='flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-main-black hover:bg-purple-98 transition-colors'
                            aria-label={cat.label}
                          >
                            <CheckboxIcon
                              checked={isCategoryFullyChecked(cat.code)}
                              indeterminate={isCategoryPartiallyChecked(cat.code)}
                            />
                            {cat.label}
                          </button>

                          {/* Type rows */}
                          {cat.types.map((type) => (
                            <button
                              key={type.code}
                              type='button'
                              onClick={() => toggleType(type.code)}
                              className='flex w-full items-center gap-3 py-2 pl-10 pr-4 text-left text-sm font-medium text-grey-600 hover:bg-purple-98 transition-colors'
                              aria-label={type.label}
                            >
                              <CheckboxIcon checked={propertyType.includes(type.code)} />
                              {type.label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>
            </div>
          </div>

          {/* Right: Compare Button */}
          <button
            type='button'
            className='rounded-lg bg-main-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-main-primary/90'
          >
            {t('compare')} (3)
          </button>
        </div>
      </div>
    </section>
  );
}
