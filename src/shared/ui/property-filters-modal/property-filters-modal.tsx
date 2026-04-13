'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/shared/ui/sheet';
import { PriceRangeSlider } from '@/shared/ui/price-range-slider';
import {
  PROPERTY_TYPES,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_TYPES
} from '@/shared/config/property-types';
import { Switch } from '@/shared/ui/switch/switch';
import { VndAmountInput } from '@/shared/ui/vnd-amount-input/vnd-amount-input';
import { Label } from '@/shared/ui/label/label';

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
      <span className='w-8 text-center text-base font-bold text-main-black'>{value}</span>
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
  onApply,
  onReset,
  translations,
}: PropertyFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);
  const [priceMin, setPriceMin] = useState(filters.priceRange.min);
  const [priceMax, setPriceMax] = useState(filters.priceRange.max);

  // Find the selected property type configuration
  const typeConfig = PROPERTY_TYPES.flatMap((cat) => cat.types).find((t) => t.code === propertyType);
  const relevantAttributes = typeConfig?.attributes || [];

  // Reset local state when modal opens or filters change
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalFilters(filters);
      setPriceMin(filters.priceRange.min);
      setPriceMax(filters.priceRange.max);
    }
    onOpenChange(newOpen);
  };

  const handleApply = () => {
    onApply({
      ...localFilters,
      priceRange: { min: priceMin, max: priceMax },
    });
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


          {/* Price Range */}
          <div className='pb-6 border-b border-grey-100'>
            <PriceRangeSlider
              minValue={0}
              maxValue={20000000000}
              currentMin={priceMin}
              currentMax={priceMax}
              onMinChange={setPriceMin}
              onMaxChange={setPriceMax}
              histogramData={[6, 8, 8, 12, 21, 35, 38, 56, 48, 32, 23, 48, 23, 17, 12, 6]}
              title={translations.priceRange}
              step={100000000}
            />
            <div className='mt-4 grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <Label className='text-xs text-grey-500'>Tối thiểu</Label>
                <VndAmountInput
                  value={priceMin}
                  onChange={(val) => setPriceMin(val)}
                  placeholder='0'
                  hidePreview
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs text-grey-500'>Tối đa</Label>
                <VndAmountInput
                  value={priceMax}
                  onChange={(val) => setPriceMax(val)}
                  placeholder='20 tỷ'
                  hidePreview
                />
              </div>
            </div>
          </div>

          {/* Features - Dynamic based on propertyType */}
          {relevantAttributes.length > 0 && (
            <div className='space-y-4 pb-6 border-b border-grey-100'>
              <h3 className='text-sm font-semibold text-[#4D5461]'>{translations.features}</h3>
              <div className='grid grid-cols-1 gap-y-4 gap-x-6'>
                {relevantAttributes.map((attrKey) => {
                  const label = ATTRIBUTE_LABELS[attrKey];
                  const type = ATTRIBUTE_TYPES[attrKey];
                  const currentValue = localFilters.attributes[attrKey];

                  if (type === 'number') {
                    return (
                      <div key={attrKey} className='flex items-center justify-between'>
                        <span className='text-base font-normal text-main-black'>{label}</span>
                        <Stepper
                          value={(currentValue as number) || 0}
                          onChange={(value) =>
                            setLocalFilters({
                              ...localFilters,
                              attributes: { ...localFilters.attributes, [attrKey]: value },
                            })
                          }
                          min={0}
                          max={20}
                        />
                      </div>
                    );
                  }

                  if (type === 'boolean') {
                    return (
                      <div key={attrKey} className='flex items-center justify-between'>
                        <span className='text-base font-normal text-main-black'>{label}</span>
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

                  // Handle text/other attributes if needed, e.g., with a simple Select
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Rental Period */}
          <div className='space-y-3'>
            <h3 className='text-sm font-semibold text-[#4D5461]'>
              {translations.rentalPeriod.label}
            </h3>
            <div className='space-y-1'>
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
