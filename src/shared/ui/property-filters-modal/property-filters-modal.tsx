'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/shared/ui/sheet';
import {
  PROPERTY_TYPES,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_TYPES,
  PropertyAttribute
} from '@/shared/config/property-types';
import { Switch } from '@/shared/ui/switch/switch';

export type RentalPeriod = 'any' | '1-12' | '13-24' | '24+';

export interface PropertyFilters {
  priceRange: {
    min: number;
    max: number;
  };
  rentalPeriod: RentalPeriod;
  attributes: Record<string, number | boolean | string | undefined>;
}

export interface PropertyFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
  propertyType?: string;
  listingType?: 'RENT' | 'SALE';
  onApply: (filters: PropertyFilters) => void;
  onReset: () => void;
  translations: {
    title: string;
    category: string;
    priceRange: string;
    features: string;
    rentalPeriod: {
      label: string;
      any: string;
      '1-12': string;
      '13-24': string;
      '24+': string;
    };
    reset: string;
    apply: string;
  };
}

function Stepper({
  value,
  onChange,
  min = 0,
  max = 10,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className='flex items-center gap-3'>
      <button
        type='button'
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          value <= min
            ? 'bg-grey-200 text-grey-400 cursor-not-allowed opacity-50'
            : 'bg-main-primary text-white hover:bg-main-primary/90 cursor-pointer'
        )}
      >
        <Minus className='h-4 w-4' strokeWidth={2} />
      </button>
      <span className='w-8 text-center text-base font-bold text-main-black'>{value === 0 ? 'Tất cả' : `${value}+`}</span>
      <button
        type='button'
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          value >= max
            ? 'bg-grey-200 text-grey-400 cursor-not-allowed opacity-50'
            : 'bg-main-primary text-white hover:bg-main-primary/90 cursor-pointer'
        )}
      >
        <Plus className='h-4 w-4' strokeWidth={2} />
      </button>
    </div>
  );
}

function RadioOption({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-3 py-2 text-left transition-colors hover:text-main-primary'
    >
      <div
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] transition-colors',
          selected ? 'border-main-primary' : 'border-purple-92'
        )}
      >
        {selected && <div className='h-3 w-3 rounded-full bg-main-primary' />}
      </div>
      <span className={cn('text-sm font-normal', selected ? 'text-main-black' : 'text-grey-500')}>
        {children}
      </span>
    </button>
  );
}

export function PropertyFiltersModal({
  open,
  onOpenChange,
  filters,
  propertyType,
  listingType,
  onApply,
  onReset,
  translations,
}: PropertyFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);

  // Find the selected property type configuration
  const typeConfig = PROPERTY_TYPES.flatMap((cat) => cat.types).find((t) => t.code === propertyType);
  
  // Default attributes if none are relevant
  const baseAttributes: PropertyAttribute[] = ['BEDROOMS', 'BATHROOMS'];
  const relevantAttributes = Array.from(new Set([...baseAttributes, ...(typeConfig?.attributes || [])]));

  // Reset local state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalFilters(filters);
    }
    onOpenChange(newOpen);
  };

  const handleApply = () => {
    onApply(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side='right'
        className='flex flex-col p-0 gap-0 w-full max-w-[480px] rounded-l-2xl'
      >
        {/* Header */}
        <SheetHeader className='px-6 pt-6 pb-4'>
          <SheetTitle className='text-2xl font-bold text-main-black'>
            {translations.title}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable content area */}
        <div className='flex-1 overflow-y-auto px-6 pb-6 space-y-6'>
          
          {/* Features Section */}
          <div className='space-y-4 pb-6 border-b border-grey-100'>
            <h3 className='text-sm font-bold text-main-black'>{translations.features}</h3>
            <div className='grid grid-cols-1 gap-y-5'>
              {relevantAttributes.map((attrKey) => {
                const label = ATTRIBUTE_LABELS[attrKey];
                const type = ATTRIBUTE_TYPES[attrKey];
                const currentValue = localFilters.attributes[attrKey];

                if (type === 'number') {
                  const labelWithUnit = attrKey === 'AREA' ? `${label} (m²)` : label;
                  return (
                    <div key={attrKey} className='flex items-center justify-between'>
                      <span className='text-base font-medium text-main-black'>{labelWithUnit}</span>
                      <Stepper
                        value={(currentValue as number) || 0}
                        onChange={(value) =>
                          setLocalFilters({
                            ...localFilters,
                            attributes: { ...localFilters.attributes, [attrKey]: value },
                          })
                        }
                        min={0}
                        max={attrKey === 'BEDROOMS' || attrKey === 'BATHROOMS' ? 10 : 100}
                      />
                    </div>
                  );
                }

                if (type === 'boolean') {
                  return (
                    <div key={attrKey} className='flex items-center justify-between'>
                      <span className='text-base font-medium text-main-black'>{label}</span>
                      <Switch
                        checked={!!currentValue}
                        onCheckedChange={(checked) =>
                          setLocalFilters({
                            ...localFilters,
                            attributes: { ...localFilters.attributes, [attrKey]: checked },
                          })
                        }
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>

          {/* Rental Period - Only for RENT */}
          {listingType === 'RENT' && (
            <div className='space-y-4'>
              <h3 className='text-sm font-bold text-main-black'>
                {translations.rentalPeriod.label}
              </h3>
              <div className='grid grid-cols-2 gap-x-4 gap-y-1'>
                <RadioOption
                  selected={localFilters.rentalPeriod === 'any'}
                  onClick={() => setLocalFilters({ ...localFilters, rentalPeriod: 'any' })}
                >
                  {translations.rentalPeriod.any}
                </RadioOption>
                <RadioOption
                  selected={localFilters.rentalPeriod === '1-12'}
                  onClick={() => setLocalFilters({ ...localFilters, rentalPeriod: '1-12' })}
                >
                  {translations.rentalPeriod['1-12']}
                </RadioOption>
                <RadioOption
                  selected={localFilters.rentalPeriod === '13-24'}
                  onClick={() => setLocalFilters({ ...localFilters, rentalPeriod: '13-24' })}
                >
                  {translations.rentalPeriod['13-24']}
                </RadioOption>
                <RadioOption
                  selected={localFilters.rentalPeriod === '24+'}
                  onClick={() => setLocalFilters({ ...localFilters, rentalPeriod: '24+' })}
                >
                  {translations.rentalPeriod['24+']}
                </RadioOption>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <SheetFooter className='sticky bottom-0 bg-white border-t border-grey-100 px-6 py-4 gap-3'>
          <Button
            type='button'
            onClick={handleReset}
            className='flex-1 rounded-lg bg-[#F4F3FF] px-6 py-3 text-base font-bold text-main-primary hover:bg-[#E9E7FF] border-none'
          >
            {translations.reset}
          </Button>
          <Button
            type='button'
            onClick={handleApply}
            className='flex-1 rounded-lg bg-main-primary px-6 py-3 text-base font-bold text-white hover:bg-main-primary/90'
          >
            {translations.apply}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
