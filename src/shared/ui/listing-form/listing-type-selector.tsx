'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

interface ListingTypeSelectorProps {
  value: string;
  onChange: (type: 'RENT' | 'SALE') => void;
  labels: { rent: string; sale: string };
}

/**
 * Radio button selector for listing type (RENT / SALE).
 * Shared between create and edit listing forms.
 */
export function ListingTypeSelector({ value, onChange, labels }: ListingTypeSelectorProps) {
  return (
    <div className='flex gap-4'>
      {(['RENT', 'SALE'] as const).map((type) => (
        <label key={type} className='flex cursor-pointer items-center gap-2'>
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
              value === type ? 'border-main-primary' : 'border-purple-92'
            )}
          >
            {value === type && (
              <div className='h-2.5 w-2.5 rounded-full bg-main-primary' />
            )}
          </div>
          <input
            type='radio'
            name='listingType'
            value={type}
            checked={value === type}
            onChange={() => onChange(type)}
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
