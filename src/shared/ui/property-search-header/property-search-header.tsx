'use client';

import { ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button/button';

export interface PropertySearchHeaderProps {
  title?: string;
  propertyCount?: number;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onMoreFilters?: () => void;
  homeLabel?: string;
  searchLabel?: string;
  moreFiltersLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PropertySearchHeader({
  title = 'Search properties',
  propertyCount = 0,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  onMoreFilters,
  homeLabel = 'Home',
  searchLabel = 'Search',
  moreFiltersLabel = 'More filters',
  action,
  className,
}: PropertySearchHeaderProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Breadcrumbs */}
      <nav className='flex items-center gap-2 text-sm'>
        <Link href='/' className='text-grey-500 transition-colors hover:text-main-primary'>
          {homeLabel}
        </Link>
        <ChevronRight className='h-4 w-4 text-grey-500' />
        <span className='font-medium text-main-black'>{searchLabel}</span>
      </nav>

      {/* Title and Property Count */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='mb-1 text-3xl font-bold leading-[1.25] tracking-[-1px] text-main-black'>
            {title}
          </h1>
          <p className='text-base font-normal leading-[1.5] text-grey-500'>
            {propertyCount.toLocaleString()} properties available to rent
          </p>
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Search Bar with More Filters */}
      <div className='flex gap-3'>
        <div className='relative flex-1'>
          <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-500' />
          <input
            type='text'
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className='h-12 w-full rounded-lg border-[1.5px] border-purple-92 bg-white pl-12 pr-4 text-base font-normal leading-[1.5] text-main-black outline-none transition-colors placeholder:text-grey-500 focus:border-main-primary focus:ring-1 focus:ring-main-primary'
          />
        </div>
        <Button
          type='button'
          onClick={onMoreFilters}
          className='flex h-12 items-center gap-2 rounded-lg bg-main-primary px-6 text-base font-bold leading-[1.5] text-white transition-colors hover:bg-main-primary/90'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
          >
            <path
              d='M4.16667 5.83333H15.8333M6.66667 10H13.3333M9.16667 14.1667H10.8333'
              stroke='white'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          {moreFiltersLabel}
        </Button>
      </div>
    </div>
  );
}
