'use client';

import * as React from 'react';
import { ChevronDown, Grid3x3, List, Filter } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Button } from '@/shared/ui/button/button';
import { VndAmountInput } from '@/shared/ui/vnd-amount-input/vnd-amount-input';
import { Label } from '@/shared/ui/label/label';

export type ViewMode = 'grid' | 'list';

export interface PropertyFiltersProps {
  // Price Filter Props
  priceRange: { min: number; max: number };
  onPriceChange: (min: number, max: number) => void;
  priceLabel: string;
  
  // Basic properties
  typeLabel: string;
  sortLabel?: string;
  
  // Handlers
  onMoreFilters: () => void;
  onSortClick?: () => void;
  
  // View mode
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  
  className?: string;
}

function FilterChip({ 
  label, 
  onClick, 
  active,
  icon: Icon = ChevronDown
}: { 
  label: string; 
  onClick?: () => void; 
  active?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border-[1.5px] px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap',
        active 
          ? 'border-main-primary bg-main-primary/5 text-main-primary' 
          : 'border-purple-92 bg-white text-main-black hover:border-main-primary/50'
      )}
    >
      <span>{label}</span>
      <Icon className={cn('h-4 w-4 transition-transform duration-200', active ? 'text-main-primary' : 'text-grey-500')} strokeWidth={2} />
    </button>
  );
}

export function PropertyFilters({
  priceRange,
  onPriceChange,
  priceLabel,
  typeLabel,
  onMoreFilters,
  viewMode = 'grid',
  onViewModeChange,
  sortLabel = 'Mới nhất',
  onSortClick,
  className,
}: PropertyFiltersProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {/* Filter Chips */}
      <div className='flex flex-wrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar'>
        {/* Price Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <div className='cursor-pointer'>
              <FilterChip 
                label={priceLabel} 
                active={priceRange.min > 0 || priceRange.max < 20000000000} 
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className='w-[420px] p-6' align='start'>
            <div className='space-y-6'>
              <h4 className='text-lg font-bold text-main-black'>Khoảng giá</h4>
              <div className='flex flex-col gap-5'>
                <div className='space-y-5'>
                  <div className='space-y-2'>
                    <Label className='text-sm font-semibold text-grey-500'>Giá tối thiểu (VNĐ)</Label>
                    <VndAmountInput
                      value={priceRange.min}
                      onChange={(val) => onPriceChange(Math.max(0, Math.trunc(val)), priceRange.max)}
                      placeholder='0'
                      hidePreview
                      inputClassName="h-12 text-lg font-medium"
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-semibold text-grey-500'>Giá tối đa (VNĐ)</Label>
                    <VndAmountInput
                      value={priceRange.max}
                      onChange={(val) => onPriceChange(priceRange.min, Math.max(0, Math.trunc(val)))}
                      placeholder='Bất kỳ'
                      hidePreview
                      inputClassName="h-12 text-lg font-medium"
                    />
                  </div>
                </div>
                <div className='flex justify-end gap-2 border-t border-purple-92 pt-4'>
                   <Button variant="link" size="sm" className='text-sm font-bold text-main-primary h-auto p-0' onClick={() => onPriceChange(0, 20000000000)}>Xóa tất cả</Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Type Filter */}
        <FilterChip label={typeLabel} onClick={onMoreFilters} />
        
        {/* Sort Filter */}
        <FilterChip label={sortLabel} onClick={onSortClick} />

        {/* More Filters button */}
        <button
          type='button'
          onClick={onMoreFilters}
          className='flex items-center gap-2 rounded-full border-[1.5px] border-main-primary bg-white px-4 py-2 text-sm font-bold text-main-primary transition-colors hover:bg-main-primary/5 whitespace-nowrap'
        >
          <Filter className='h-4 w-4' strokeWidth={2.5} />
          <span>Bộ lọc khác</span>
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className='hidden sm:flex items-center gap-1 rounded-xl border-[1.5px] border-purple-92 bg-white p-1 shadow-sm shrink-0'>
        <button
          type='button'
          onClick={() => onViewModeChange?.('grid')}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
            viewMode === 'grid'
              ? 'bg-main-primary text-white shadow-md'
              : 'text-grey-500 hover:text-main-primary hover:bg-main-primary/5'
          )}
          aria-label='Grid view'
        >
          <Grid3x3 className='h-5 w-5' strokeWidth={2} />
        </button>
        <button
          type='button'
          onClick={() => onViewModeChange?.('list')}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
            viewMode === 'list'
              ? 'bg-main-primary text-white shadow-md'
              : 'text-grey-500 hover:text-main-primary hover:bg-main-primary/5'
          )}
          aria-label='List view'
        >
          <List className='h-5 w-5' strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
