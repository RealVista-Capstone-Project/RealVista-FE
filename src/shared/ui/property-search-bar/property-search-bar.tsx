'use client';

import { Calendar } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface PropertySearchBarProps {
  location?: string;
  locationLabel?: string;
  whenLabel?: string;
  whenPlaceholder?: string;
  priceLabel?: string;
  priceValue?: string;
  propertyTypeLabel?: string;
  propertyTypeValue?: string;
  searchButtonLabel?: string;
  onLocationChange?: (value: string) => void;
  onDateChange?: (date: Date | undefined) => void;
  onPriceChange?: (value: string) => void;
  onPropertyTypeChange?: (value: string) => void;
  onSearch?: () => void;
  className?: string;
}

export function PropertySearchBar({
  location = 'New York, USA',
  locationLabel = 'Location',
  whenLabel = 'When',
  whenPlaceholder = 'Select Move-in Date',
  priceLabel = 'Price',
  priceValue = '$500-$2,500',
  propertyTypeLabel = 'Property Type',
  propertyTypeValue = 'Houses',
  searchButtonLabel = 'Search',
  onLocationChange,
  onDateChange,
  onPriceChange,
  onPropertyTypeChange,
  onSearch,
  className,
}: PropertySearchBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-0 overflow-hidden rounded-br-lg rounded-bl-lg rounded-tr-lg bg-white',
        className
      )}
    >
      {/* Location Field */}
      <div className='flex flex-col gap-1 border-r border-grey-200 px-8 py-6'>
        <label className='text-base font-medium leading-[1.5] text-main-black opacity-50'>
          {locationLabel}
        </label>
        <input
          type='text'
          value={location}
          onChange={(e) => onLocationChange?.(e.target.value)}
          className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black outline-none'
        />
      </div>

      {/* When (Date Picker) */}
      <div className='flex flex-col gap-1 border-r border-grey-200 px-8 py-6'>
        <label className='text-base font-medium leading-[1.5] text-main-black opacity-50'>
          {whenLabel}
        </label>
        <button
          type='button'
          onClick={() => {
            // TODO: Implement date picker
            console.log('Open date picker');
          }}
          className='flex items-center gap-2 text-left'
        >
          <span className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
            {whenPlaceholder}
          </span>
          <div className='relative flex h-5 w-5 items-center justify-center'>
            <div className='absolute inset-0 rounded-full bg-purple-96'></div>
            <Calendar className='relative h-3 w-3 text-main-primary' strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* Price Range */}
      <div className='flex flex-col gap-1 border-r border-grey-200 px-8 py-6'>
        <label className='text-base font-medium leading-[1.5] text-main-black opacity-50'>
          {priceLabel}
        </label>
        <button
          type='button'
          onClick={() => {
            // TODO: Implement price selector
            console.log('Open price selector');
          }}
          className='flex items-center gap-2 text-left'
        >
          <span className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
            {priceValue}
          </span>
          <div className='relative flex h-5 w-5 items-center justify-center'>
            <div className='absolute inset-0 rounded-full bg-purple-96'></div>
            <svg
              className='relative h-3 w-3 text-main-primary'
              fill='none'
              viewBox='0 0 12 12'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M3 4.5L6 7.5L9 4.5'
                stroke='currentColor'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Property Type */}
      <div className='flex flex-col gap-1 border-r border-grey-200 px-8 py-6'>
        <label className='text-base font-medium leading-[1.5] text-main-black opacity-50'>
          {propertyTypeLabel}
        </label>
        <button
          type='button'
          onClick={() => {
            // TODO: Implement property type selector
            console.log('Open property type selector');
          }}
          className='flex items-center gap-2 text-left'
        >
          <span className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
            {propertyTypeValue}
          </span>
          <div className='relative flex h-5 w-5 items-center justify-center'>
            <div className='absolute inset-0 rounded-full bg-purple-96'></div>
            <svg
              className='relative h-3 w-3 text-main-primary'
              fill='none'
              viewBox='0 0 12 12'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M3 4.5L6 7.5L9 4.5'
                stroke='currentColor'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Search Button */}
      <button
        type='button'
        onClick={onSearch}
        className='flex h-full items-center justify-center bg-main-primary px-8 py-6 text-base font-bold leading-[1.5] text-white transition-colors hover:bg-main-primary/90'
        style={{ fontFeatureSettings: "'ss06', 'ss04', 'liga' 0" }}
      >
        {searchButtonLabel}
      </button>
    </div>
  );
}
