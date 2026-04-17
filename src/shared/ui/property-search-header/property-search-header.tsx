'use client';

import * as React from 'react';
import { Search, Settings2 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';

export interface PropertySearchHeaderProps {
  title: string;
  propertyCount: number;
  propertyCountLabel: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onMoreFilters?: () => void;
  moreFiltersLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Header for property search pages
 * Displays title, total count, breadcrumbs (optional), and search controls
 */
export function PropertySearchHeader({
  title,
  propertyCount,
  propertyCountLabel,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  onKeyDown,
  onMoreFilters,
  moreFiltersLabel = 'Bộ lọc',
  action,
  className,
}: PropertySearchHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
              {title}
            </h1>
            {action && <div className='flex shrink-0 items-center'>{action}</div>}
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 rounded-full bg-primary' />
            <p className='text-sm font-medium text-muted-foreground'>
              <span className='font-bold text-primary'>{propertyCount}</span> {propertyCountLabel}
            </p>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <div className='relative flex-1'>
          <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
            className='h-12 w-full border-primary/20 bg-white pl-12 pr-4 text-base font-medium shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/10'
          />
        </div>
        <button
          onClick={onMoreFilters}
          className='flex h-12 items-center gap-2 rounded-full border-[1.5px] border-primary/20 bg-white px-5 font-bold text-foreground transition-all hover:border-primary sm:hidden'
        >
          <Settings2 className='h-5 w-5' />
          <span className='hidden xs:inline'>{moreFiltersLabel}</span>
        </button>
      </div>
    </div>
  );
}
