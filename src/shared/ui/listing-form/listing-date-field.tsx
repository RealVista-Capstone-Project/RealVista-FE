'use client';

import * as React from 'react';

interface ListingDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
}

/**
 * Date picker field using the native date input.
 * Used for the "Available From" date in listing forms.
 */
export function ListingDateField({ value, onChange, label, error }: ListingDateFieldProps) {
  return (
    <div className='flex flex-col gap-2'>
      <label className='text-sm font-medium text-main-black'>{label}</label>
      <input
        type='date'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full rounded-lg border border-purple-92 bg-white px-4 py-3 text-sm text-main-black transition-colors focus:border-primary focus:outline-none'
      />
      {error && <span className='text-xs text-red-500'>{error}</span>}
    </div>
  );
}
