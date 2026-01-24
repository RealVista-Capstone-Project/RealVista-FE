'use client';

import { Calendar, ChevronDown } from 'lucide-react';
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

// Reusable icon wrapper component
function IconWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative flex h-5 w-5 shrink-0 items-center justify-center'>
      <div className='absolute inset-0 rounded-full bg-purple-96' />
      {children}
    </div>
  );
}

// Reusable dropdown chevron icon
function DropdownIcon() {
  return (
    <IconWrapper>
      <ChevronDown className='relative h-3 w-3 text-main-primary' strokeWidth={2.5} />
    </IconWrapper>
  );
}

// Vertical divider component
function Divider() {
  return <div className='h-11 w-px shrink-0 bg-grey-200' />;
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
        'flex h-[104px] items-center rounded-br-lg rounded-bl-lg rounded-tr-lg bg-white',
        className
      )}
    >
      {/* Location Field */}
      <div className='flex flex-col gap-1 py-6 pl-8 pr-8'>
        <label className='text-base font-medium leading-[1.5] text-main-black opacity-50'>
          {locationLabel}
        </label>
        <input
          type='text'
          value={location}
          onChange={(e) => onLocationChange?.(e.target.value)}
          className='w-[180px] text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black outline-none'
        />
      </div>

      <Divider />

      {/* When (Date Picker) */}
      <div className='flex flex-col gap-1 px-8 py-6'>
        <label className='text-base font-medium leading-[1.5] text-main-black opacity-50'>
          {whenLabel}
        </label>
        <button
          type='button'
          onClick={() => {
            // TODO: Implement date picker
            console.log('Open date picker');
          }}
          className='flex items-center gap-3 text-left'
        >
          <span className='w-[180px] text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
            {whenPlaceholder}
          </span>
          <IconWrapper>
            <Calendar className='relative h-3 w-3 text-main-primary' strokeWidth={2.5} />
          </IconWrapper>
        </button>
      </div>

      <Divider />

      {/* Price Range */}
      <div className='flex flex-col gap-1 px-8 py-6'>
        <label className='text-base font-medium leading-[1.5] text-main-black opacity-50'>
          {priceLabel}
        </label>
        <button
          type='button'
          onClick={() => {
            // TODO: Implement price selector
            console.log('Open price selector');
          }}
          className='flex items-center gap-3 text-left'
        >
          <span className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
            {priceValue}
          </span>
          <DropdownIcon />
        </button>
      </div>

      <Divider />

      {/* Property Type */}
      <div className='flex flex-col gap-1 px-8 py-6'>
        <label className='text-base font-medium leading-[1.5] text-main-black opacity-50'>
          {propertyTypeLabel}
        </label>
        <button
          type='button'
          onClick={() => {
            // TODO: Implement property type selector
            console.log('Open property type selector');
          }}
          className='flex items-center gap-3 text-left'
        >
          <span className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
            {propertyTypeValue}
          </span>
          <DropdownIcon />
        </button>
      </div>

      <Divider />

      {/* Search Button */}
      <div className='flex h-full items-center px-4 py-6'>
        <button
          type='button'
          onClick={onSearch}
          className='flex w-[125px] items-center justify-center rounded-lg bg-main-primary px-8 py-4 text-base font-bold leading-[1.5] text-white transition-colors hover:bg-main-primary/90'
          style={{ fontFeatureSettings: "'ss06', 'ss04', 'liga' 0" }}
        >
          {searchButtonLabel}
        </button>
      </div>
    </div>
  );
}
