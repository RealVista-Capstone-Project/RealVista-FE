'use client';

import { Calendar, ChevronDown, Search, Bookmark, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button/button';

interface RealVistaPropertyListingSearchBarProps {
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
  onSaveSearch?: () => void;
  onAdvancedFilters?: () => void;
  showSaveButton?: boolean;
  showAdvancedFilters?: boolean;
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

// Calendar icon component
function CalendarIcon() {
  return (
    <IconWrapper>
      <Calendar className='relative h-3 w-3 text-main-primary' strokeWidth={2.5} />
    </IconWrapper>
  );
}

// Vertical divider component - 44px height to match Figma design
function Divider() {
  return <div className='h-11 w-px shrink-0 bg-grey-200' />;
}

// Field label component
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className='text-base font-medium leading-[1.5] text-main-black opacity-50'>
      {children}
    </span>
  );
}

// Field value text component
function FieldValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'text-lg font-bold leading-[1.45] tracking-[-0.5px] text-main-black',
        className
      )}
    >
      {children}
    </span>
  );
}

export function RealVistaPropertyListingSearchBar({
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
  onSaveSearch,
  onAdvancedFilters,
  showSaveButton = true,
  showAdvancedFilters = true,
  className,
}: RealVistaPropertyListingSearchBarProps) {
  return (
    <>
      {/* Mobile Search Bar - Single Field */}
      <div className='flex lg:hidden w-full flex-col gap-4'>
        <div className='relative w-full'>
          <input
            type='text'
            placeholder='Search location'
            value={location}
            onChange={(e) => onLocationChange?.(e.target.value)}
            className='h-16 w-full rounded-lg border border-grey-200 bg-white px-4 pr-16 text-base font-medium leading-[1.5] text-main-black placeholder:text-grey-400 outline-none focus:border-main-primary focus:ring-1 focus:ring-main-primary'
          />
          <Button
            type='button'
            onClick={onSearch}
            className='absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-lg bg-main-primary text-white transition-colors hover:bg-main-primary/90'
            aria-label='Search'
            size='icon'
          >
            <Search className='h-5 w-5' strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      {/* Desktop Search Bar - Multi-Field */}
      <div
        className={cn(
          'hidden lg:flex lg:flex-row lg:h-[104px] w-full lg:items-center rounded-lg bg-white shadow-sm lg:shadow-none',
          className
        )}
      >
        {/* Location Field - ~180px base width */}
        <div className='flex min-w-0 flex-[1.43] flex-col gap-1 px-4 py-4 lg:py-6 lg:pl-8 lg:pr-7'>
          <FieldLabel>{locationLabel}</FieldLabel>
          <input
            type='text'
            value={location}
            onChange={(e) => onLocationChange?.(e.target.value)}
            className='h-7 min-w-0 w-full bg-transparent text-lg font-bold leading-[1.45] tracking-[-0.5px] text-main-black outline-none border-none shadow-none p-0 focus:outline-none focus:ring-0'
          />
        </div>

        <div className='hidden lg:block'>
          <Divider />
        </div>

        {/* When (Date Picker) - ~180px base width */}
        <div className='flex min-w-0 flex-[1.43] flex-col gap-1 px-4 py-4 lg:px-7 lg:py-6'>
          <FieldLabel>{whenLabel}</FieldLabel>
          <button
            type='button'
            onClick={() => {
              // TODO: Implement date picker
              onDateChange?.(undefined);
              console.log('Date clicked');
            }}
            className='flex h-7 items-center gap-3 text-left w-full bg-transparent border-none p-0 cursor-pointer'
          >
            <FieldValue className='min-w-0 truncate flex-1'>{whenPlaceholder}</FieldValue>
            <CalendarIcon />
          </button>
        </div>

        <div className='hidden lg:block'>
          <Divider />
        </div>

        {/* Price Range - ~126px base width */}
        <div className='flex min-w-0 flex-1 flex-col gap-1 px-4 py-4 lg:px-7 lg:py-6'>
          <FieldLabel>{priceLabel}</FieldLabel>
          <button
            type='button'
            onClick={() => {
              // TODO: Implement price selector
              onPriceChange?.('');
              console.log('Price clicked');
            }}
            className='flex h-7 items-center gap-3 text-left w-full bg-transparent border-none p-0 cursor-pointer'
          >
            <FieldValue className='min-w-0 truncate flex-1'>{priceValue}</FieldValue>
            <DropdownIcon />
          </button>
        </div>

        <div className='hidden lg:block'>
          <Divider />
        </div>

        {/* Property Type - ~108px base width */}
        <div className='flex min-w-0 flex-[0.86] flex-col gap-1 px-4 py-4 lg:px-7 lg:py-6'>
          <FieldLabel>{propertyTypeLabel}</FieldLabel>
          <button
            type='button'
            onClick={() => {
              // TODO: Implement property type selector
              onPropertyTypeChange?.('');
              console.log('Property type clicked');
            }}
            className='flex h-7 items-center gap-3 text-left w-full bg-transparent border-none p-0 cursor-pointer'
          >
            <FieldValue className='min-w-0 truncate flex-1'>{propertyTypeValue}</FieldValue>
            <DropdownIcon />
          </button>
        </div>

        <div className='hidden lg:block'>
          <Divider />
        </div>

        {/* Action Buttons */}
        <div className='flex h-full flex-shrink-0 items-center gap-3 py-6 lg:pr-6 lg:pl-7'>
          {showAdvancedFilters && (
            <Button
              type='button'
              variant='outline'
              onClick={onAdvancedFilters}
              className='h-[56px] px-4 flex items-center gap-2 border-grey-300 hover:border-main-primary hover:bg-purple-96'
              title='Advanced Filters'
            >
              <SlidersHorizontal className='h-5 w-5' />
              <span className='hidden xl:inline'>Filters</span>
            </Button>
          )}

          {showSaveButton && (
            <Button
              type='button'
              variant='outline'
              onClick={onSaveSearch}
              className='h-[56px] px-4 flex items-center gap-2 border-grey-300 hover:border-main-primary hover:bg-purple-96'
              title='Save Search'
            >
              <Bookmark className='h-5 w-5' />
              <span className='hidden xl:inline'>Save</span>
            </Button>
          )}

          {/* Search Button */}
          <Button
            type='button'
            onClick={onSearch}
            className='w-[125px] h-[56px] flex items-center justify-center rounded-lg bg-main-primary text-base font-bold leading-[1.5] text-white hover:bg-main-primary/90 focus-visible:ring-2 focus-visible:ring-main-primary focus-visible:ring-offset-2'
            style={{ fontFeatureSettings: "'ss06', 'ss04', 'liga' 0" }}
          >
            {searchButtonLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
