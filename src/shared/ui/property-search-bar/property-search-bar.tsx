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
        'text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black',
        className
      )}
    >
      {children}
    </span>
  );
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
        'flex h-[104px] w-full max-w-[1120px] items-center rounded-br-lg rounded-bl-lg rounded-tr-lg bg-white',
        className
      )}
    >
      {/* Location Field */}
      <div className='flex flex-col gap-1 py-6 pl-8 pr-7'>
        <FieldLabel>{locationLabel}</FieldLabel>
        <input
          type='text'
          value={location}
          onChange={(e) => onLocationChange?.(e.target.value)}
          className='h-7 w-[180px] bg-transparent text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black outline-none'
        />
      </div>

      <Divider />

      {/* When (Date Picker) */}
      <div className='flex flex-col gap-1 px-7 py-6'>
        <FieldLabel>{whenLabel}</FieldLabel>
        <button
          type='button'
          onClick={() => {
            // TODO: Implement date picker
            onDateChange?.(undefined);
          }}
          className='flex h-7 items-center gap-3 text-left'
        >
          <FieldValue className='w-[180px]'>{whenPlaceholder}</FieldValue>
          <CalendarIcon />
        </button>
      </div>

      <Divider />

      {/* Price Range */}
      <div className='flex flex-col gap-1 px-7 py-6'>
        <FieldLabel>{priceLabel}</FieldLabel>
        <button
          type='button'
          onClick={() => {
            // TODO: Implement price selector
            onPriceChange?.('');
          }}
          className='flex h-7 items-center gap-3 text-left'
        >
          <FieldValue>{priceValue}</FieldValue>
          <DropdownIcon />
        </button>
      </div>

      <Divider />

      {/* Property Type */}
      <div className='flex flex-col gap-1 px-7 py-6'>
        <FieldLabel>{propertyTypeLabel}</FieldLabel>
        <button
          type='button'
          onClick={() => {
            // TODO: Implement property type selector
            onPropertyTypeChange?.('');
          }}
          className='flex h-7 items-center gap-3 text-left'
        >
          <FieldValue>{propertyTypeValue}</FieldValue>
          <DropdownIcon />
        </button>
      </div>

      <Divider />

      {/* Search Button */}
      <div className='flex h-full flex-1 items-center justify-end px-4 py-6'>
        <button
          type='button'
          onClick={onSearch}
          className='flex w-[125px] items-center justify-center overflow-hidden rounded-lg bg-main-primary px-8 py-4 text-base font-bold leading-[1.5] text-white transition-colors hover:bg-main-primary/90'
          style={{ fontFeatureSettings: "'ss06', 'ss04', 'liga' 0" }}
        >
          {searchButtonLabel}
        </button>
      </div>
    </div>
  );
}
