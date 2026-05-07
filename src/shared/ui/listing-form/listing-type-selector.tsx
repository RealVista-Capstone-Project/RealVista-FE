'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

interface ListingTypeSelectorProps {
  value: string;
  onChange: (type: 'RENT' | 'SALE') => void;
  labels: { rent: string; sale: string };
  disabled?: boolean;
  compact?: boolean;
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
  compact = false,
}: ListingTypeSelectorProps) {
  return (
    <div className={cn('flex', compact ? 'gap-3' : 'gap-4', disabled && 'opacity-60 cursor-not-allowed')}>
      {(['RENT', 'SALE'] as const).map((type) => (
        <label
          key={type}
          className={cn('flex items-center', compact ? 'gap-1.5' : 'gap-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
        >
          <input
            type='radio'
            name='listingType'
            value={type}
            checked={value === type}
            onChange={() => !disabled && onChange(type)}
            disabled={disabled}
            className='sr-only peer'
          />
          <div
            className={cn(
              'flex items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
              compact ? 'h-[18px] w-[18px]' : 'h-5 w-5',
              value === type ? 'border-primary' : 'border-primary/20',
              disabled && value === type && 'border-secondary/30'
            )}
          >
            {value === type && (
              <div
                className={cn(
                  'rounded-full bg-primary',
                  compact ? 'h-2.5 w-2.5' : 'h-2.5 w-2.5',
                  disabled && 'bg-secondary/30'
                )}
              />
            )}
          </div>
          <span className='text-sm font-medium text-foreground'>
            {type === 'RENT' ? labels.rent : labels.sale}
          </span>
        </label>
      ))}
    </div>
  );
}
