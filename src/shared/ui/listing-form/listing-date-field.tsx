'use client';

import * as React from 'react';
import { vi } from 'date-fns/locale';
import { DatePickerInput } from '@/shared/ui/realvista-input-date-picker/realvista-input-date-picker';

interface ListingDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
}

/**
 * Date picker field using shadcn Calendar + Popover with Vietnamese locale.
 * Used for the "Available From" date in listing forms.
 */
export function ListingDateField({ value, onChange, label, error }: ListingDateFieldProps) {
  return (
    <div className='flex flex-col gap-2'>
      <DatePickerInput
        value={value}
        onChange={onChange}
        label={label}
        placeholder='dd/mm/yyyy'
        locale={vi}
      />
      {error && <span className='text-xs text-red-500'>{error}</span>}
    </div>
  );
}
