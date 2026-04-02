'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

interface ListingTypeSelectorProps {
  value: string;
  onChange: (type: 'RENT' | 'SALE') => void;
  labels: { rent: string; sale: string };
  disabled?: boolean;
}

/**
 * Radio button selector for listing type (RENT / SALE).
 * Shared between create and edit listing forms.
 */
export function ListingTypeSelector({
  value,
  onChange,
  labels,
  disabled = false,
}: ListingTypeSelectorProps) {
  return (
    <div className={cn('flex gap-4', disabled && 'opacity-60 cursor-not-allowed')}>
      {(['RENT', 'SALE'] as const).map((type) => (
        <label
          key={type}
          className={cn('flex items-center gap-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
        >
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
              value === type ? 'border-main-primary' : 'border-purple-92',
              disabled && value === type && 'border-main-secondary/30'
            )}
          >
            {value === type && (
              <div
                className={cn('h-2.5 w-2.5 rounded-full bg-main-primary', disabled && 'bg-main-secondary/30')}
              />
            )}
          </div>
          <input
            type='radio'
            name='listingType'
            value={type}
            checked={value === type}
            onChange={() => !disabled && onChange(type)}
            disabled={disabled}
            className='sr-only'
          />
          <span className='text-sm font-medium text-main-black'>
            {type === 'RENT' ? labels.rent : labels.sale}
          </span>
        </label>
      ))}
    </div>
  );
}
