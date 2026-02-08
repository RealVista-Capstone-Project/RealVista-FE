'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';

export type PropertyCategory = 'houses' | 'rooms' | 'apartment';
export type RentalPeriod = 'any' | '1-12' | '13-24' | '24+';

export interface PropertyFilters {
  category: PropertyCategory;
  priceRange: {
    min: number;
    max: number;
  };
  bedrooms: number;
  bathrooms: number;
  rentalPeriod: RentalPeriod;
}

export interface PropertyFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onReset: () => void;
  translations: {
    title: string;
    categories: {
      houses: string;
      rooms: string;
      apartment: string;
    };
    priceRange: string;
    bedroom: string;
    bathroom: string;
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

function CategoryButton({
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
      className={cn(
        'rounded-lg px-6 py-2.5 text-sm font-medium transition-colors',
        selected
          ? 'bg-main-primary text-white'
          : 'border-[1.5px] border-purple-92 bg-white text-main-black hover:bg-purple-98'
      )}
    >
      {children}
    </button>
  );
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
          'flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] transition-colors',
          value <= min
            ? 'border-grey-300 text-grey-300 cursor-not-allowed'
            : 'border-main-primary text-main-primary hover:bg-purple-96'
        )}
      >
        <Minus className='h-4 w-4' strokeWidth={2} />
      </button>
      <span className='w-8 text-center text-base font-medium text-main-black'>{value}</span>
      <button
        type='button'
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] transition-colors',
          value >= max
            ? 'border-grey-300 text-grey-300 cursor-not-allowed'
            : 'border-main-primary text-main-primary hover:bg-purple-96'
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
  onApply,
  onReset,
  translations,
}: PropertyFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);
  const [priceMin, setPriceMin] = useState(filters.priceRange.min);
  const [priceMax, setPriceMax] = useState(filters.priceRange.max);

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-[480px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-main-black'>
            {translations.title}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Category Selection */}
          <div className='space-y-3'>
            <div className='flex gap-3'>
              <CategoryButton
                selected={localFilters.category === 'houses'}
                onClick={() => setLocalFilters({ ...localFilters, category: 'houses' })}
              >
                {translations.categories.houses}
              </CategoryButton>
              <CategoryButton
                selected={localFilters.category === 'rooms'}
                onClick={() => setLocalFilters({ ...localFilters, category: 'rooms' })}
              >
                {translations.categories.rooms}
              </CategoryButton>
              <CategoryButton
                selected={localFilters.category === 'apartment'}
                onClick={() => setLocalFilters({ ...localFilters, category: 'apartment' })}
              >
                {translations.categories.apartment}
              </CategoryButton>
            </div>
          </div>

          {/* Price Range */}
          <div className='space-y-3'>
            <h3 className='text-base font-semibold text-main-black'>{translations.priceRange}</h3>
            <div className='space-y-4'>
              {/* Histogram placeholder - simple bars for visual representation */}
              <div className='flex items-end justify-between gap-1 h-16 px-2'>
                {Array.from({ length: 20 }).map((_, i) => {
                  const height = Math.random() * 100;
                  return (
                    <div
                      key={i}
                      className='flex-1 bg-purple-92 rounded-t-sm'
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>

              {/* Dual Range Slider */}
              <div className='relative px-2'>
                <div className='relative h-2 bg-purple-92 rounded-full'>
                  <div
                    className='absolute h-2 bg-main-primary rounded-full'
                    style={{
                      left: `${(priceMin / 2000000) * 100}%`,
                      right: `${100 - (priceMax / 2000000) * 100}%`,
                    }}
                  />
                </div>
                <input
                  type='range'
                  min='0'
                  max='2000000'
                  step='10000'
                  value={priceMin}
                  onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 10000))}
                  className='absolute top-0 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-main-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-main-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer'
                />
                <input
                  type='range'
                  min='0'
                  max='2000000'
                  step='10000'
                  value={priceMax}
                  onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin + 10000))}
                  className='absolute top-0 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-main-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-main-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer'
                />
              </div>

              {/* Price Labels */}
              <div className='flex justify-between px-2'>
                <span className='text-sm font-medium text-grey-500'>
                  ${priceMin.toLocaleString()}
                </span>
                <span className='text-sm font-medium text-grey-500'>
                  ${priceMax.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-base font-normal text-main-black'>{translations.bedroom}</span>
              <Stepper
                value={localFilters.bedrooms}
                onChange={(value) => setLocalFilters({ ...localFilters, bedrooms: value })}
                min={0}
                max={10}
              />
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-base font-normal text-main-black'>{translations.bathroom}</span>
              <Stepper
                value={localFilters.bathrooms}
                onChange={(value) => setLocalFilters({ ...localFilters, bathrooms: value })}
                min={0}
                max={10}
              />
            </div>
          </div>

          {/* Rental Period */}
          <div className='space-y-3'>
            <h3 className='text-base font-semibold text-main-black'>
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

        <DialogFooter className='gap-3 pt-4'>
          <Button
            type='button'
            onClick={handleReset}
            className='flex-1 rounded-lg border-[1.5px] border-purple-92 bg-white px-6 py-3 text-base font-bold text-main-primary hover:bg-purple-98'
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
