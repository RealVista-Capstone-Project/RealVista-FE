'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';

interface ListingDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
}

/**
 * Date picker field with calendar icon overlay.
 * Used for the "Available From" date in listing forms.
 */
export function ListingDateField({ value, onChange, label, error }: ListingDateFieldProps) {
  return (
    <div className='flex flex-col gap-2'>
      <label className='text-sm font-medium text-main-black'>{label}</label>
      <div className='relative'>
        <input
          type='date'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='w-full rounded-lg border border-purple-92 bg-white px-4 py-3 text-sm text-main-black transition-colors focus:border-main-primary focus:outline-none'
        />
        <Calendar className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-main-secondary/40 pointer-events-none' />
      </div>
      {error && <span className='text-xs text-red-500'>{error}</span>}
    </div>
  );
}
