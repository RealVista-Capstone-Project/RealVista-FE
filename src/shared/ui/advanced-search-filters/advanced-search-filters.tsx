'use client';

import { useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { Button } from '@/shared/ui/button/button';
import { AdvancedSearchRequest } from '@/shared/types/search';
import { cn } from '@/shared/lib/utils';

interface AdvancedSearchFiltersProps {
  onApplyFilters: (filters: AdvancedSearchRequest) => void;
  onClose: () => void;
  initialFilters?: AdvancedSearchRequest;
  className?: string;
}

export function AdvancedSearchFilters({
  onApplyFilters,
  onClose,
  initialFilters,
  className,
}: AdvancedSearchFiltersProps) {
  const [filters, setFilters] = useState<AdvancedSearchRequest>(
    initialFilters || {
      listingType: 'SALE',
      sortBy: 'PRIORITY',
    }
  );

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      listingType: 'SALE',
      sortBy: 'PRIORITY',
    });
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4',
        className
      )}
      onClick={onClose}
    >
      <div
        className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <h2 className='text-2xl font-bold text-main-black'>Advanced Filters</h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-grey-100 rounded-lg transition-colors'
            aria-label='Close'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Listing Type */}
          <div>
            <label className='block text-sm font-medium text-main-black mb-2'>
              Listing Type
            </label>
            <div className='flex gap-3'>
              <Button
                type='button'
                variant={filters.listingType === 'SALE' ? 'default' : 'outline'}
                onClick={() => setFilters({ ...filters, listingType: 'SALE' })}
                className='flex-1'
              >
                Buy
              </Button>
              <Button
                type='button'
                variant={filters.listingType === 'RENT' ? 'default' : 'outline'}
                onClick={() => setFilters({ ...filters, listingType: 'RENT' })}
                className='flex-1'
              >
                Rent
              </Button>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className='block text-sm font-medium text-main-black mb-2'>
              Price Range
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <input
                type='number'
                placeholder='Min Price'
                value={filters.price?.[0] || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    price: [e.target.value ? Number(e.target.value) : null, filters.price?.[1] || null],
                  })
                }
                className='px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
              />
              <input
                type='number'
                placeholder='Max Price'
                value={filters.price?.[1] || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    price: [filters.price?.[0] || null, e.target.value ? Number(e.target.value) : null],
                  })
                }
                className='px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
              />
            </div>
          </div>

          {/* Area Range */}
          <div>
            <label className='block text-sm font-medium text-main-black mb-2'>
              Area (m²)
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <input
                type='number'
                placeholder='Min Area'
                value={filters.area?.[0] || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    area: [e.target.value ? Number(e.target.value) : null, filters.area?.[1] || null],
                  })
                }
                className='px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
              />
              <input
                type='number'
                placeholder='Max Area'
                value={filters.area?.[1] || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    area: [filters.area?.[0] || null, e.target.value ? Number(e.target.value) : null],
                  })
                }
                className='px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
              />
            </div>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-main-black mb-2'>
                Bedrooms (min)
              </label>
              <input
                type='number'
                min='0'
                placeholder='Any'
                value={filters.bedrooms || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    bedrooms: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className='w-full px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-main-black mb-2'>
                Bathrooms (min)
              </label>
              <input
                type='number'
                min='0'
                placeholder='Any'
                value={filters.bathrooms || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    bathrooms: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className='w-full px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
              />
            </div>
          </div>

          {/* Media Filters */}
          <div>
            <label className='block text-sm font-medium text-main-black mb-2'>
              Media
            </label>
            <div className='flex gap-4'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={filters.hasVideo || false}
                  onChange={(e) =>
                    setFilters({ ...filters, hasVideo: e.target.checked })
                  }
                  className='w-4 h-4 text-main-primary border-grey-300 rounded focus:ring-main-primary'
                />
                <span className='text-sm text-main-black'>Has Video</span>
              </label>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={filters.has3D || false}
                  onChange={(e) =>
                    setFilters({ ...filters, has3D: e.target.checked })
                  }
                  className='w-4 h-4 text-main-primary border-grey-300 rounded focus:ring-main-primary'
                />
                <span className='text-sm text-main-black'>Has 3D Tour</span>
              </label>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className='block text-sm font-medium text-main-black mb-2'>
              Sort By
            </label>
            <select
              value={filters.sortBy || 'PRIORITY'}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sortBy: e.target.value as AdvancedSearchRequest['sortBy'],
                })
              }
              className='w-full px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
            >
              <option value='PRIORITY'>Priority (Featured First)</option>
              <option value='DATE_DESC'>Newest First</option>
              <option value='PRICE_ASC'>Price: Low to High</option>
              <option value='PRICE_DESC'>Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between p-6 border-t bg-grey-50'>
          <Button
            type='button'
            variant='outline'
            onClick={handleReset}
            className='px-6'
          >
            Reset Filters
          </Button>
          <div className='flex gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='px-6'
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleApply}
              className='px-6 bg-main-primary hover:bg-main-primary/90'
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
