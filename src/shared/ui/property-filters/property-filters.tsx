'use client';

import { ChevronDown, Grid3x3, List } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type ViewMode = 'grid' | 'list';

export interface FilterOption {
  label: string;
  value: string;
  onClick?: () => void;
}

export interface PropertyFiltersProps {
  priceFilter?: FilterOption;
  bedsFilter?: FilterOption;
  typeFilter?: FilterOption;
  sortFilter?: FilterOption;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  className?: string;
}

function FilterChip({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-2 rounded-full border-[1.5px] border-purple-92 bg-white px-4 py-2 text-sm font-medium leading-[1.4] text-main-black transition-colors hover:bg-purple-98'
    >
      <span>{label}</span>
      <ChevronDown className='h-4 w-4 text-grey-500' strokeWidth={2} />
    </button>
  );
}

export function PropertyFilters({
  priceFilter = { label: 'Any Price', value: 'any' },
  bedsFilter = { label: '2-4 Beds', value: '2-4' },
  typeFilter = { label: 'All Types', value: 'all' },
  sortFilter = { label: 'Newest', value: 'newest' },
  viewMode = 'grid',
  onViewModeChange,
  className,
}: PropertyFiltersProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* Filter Chips */}
      <div className='flex flex-wrap items-center gap-2'>
        <FilterChip label={priceFilter.label} onClick={priceFilter.onClick} />
        <FilterChip label={bedsFilter.label} onClick={bedsFilter.onClick} />
        <FilterChip label={typeFilter.label} onClick={typeFilter.onClick} />
        <FilterChip label={sortFilter.label} onClick={sortFilter.onClick} />
      </div>

      {/* View Mode Toggle */}
      <div className='flex items-center gap-1 rounded-lg border-[1.5px] border-purple-92 bg-white p-1'>
        <button
          type='button'
          onClick={() => onViewModeChange?.('grid')}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded transition-colors',
            viewMode === 'grid'
              ? 'bg-purple-96 text-main-primary'
              : 'text-grey-500 hover:text-main-primary'
          )}
          aria-label='Grid view'
        >
          <Grid3x3 className='h-4 w-4' strokeWidth={2} />
        </button>
        <button
          type='button'
          onClick={() => onViewModeChange?.('list')}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded transition-colors',
            viewMode === 'list'
              ? 'bg-purple-96 text-main-primary'
              : 'text-grey-500 hover:text-main-primary'
          )}
          aria-label='List view'
        >
          <List className='h-4 w-4' strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
