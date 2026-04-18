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
      <label className='text-sm font-medium text-foreground'>{label}</label>
      <input
        type='date'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full rounded-lg border border-primary/20 bg-background px-4 py-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
      />
      {error && <span className='text-xs text-red-500'>{error}</span>}
    </div>
  );
}
