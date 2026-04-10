'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/* ─── Name Input ─── */

interface ListingNameInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  error?: string;
  maxLength?: number;
}

export function ListingNameInput({
  value,
  onChange,
  label,
  placeholder,
  error,
  maxLength = 500,
}: ListingNameInputProps) {
  return (
    <div className='flex flex-col gap-2'>
      <label className='text-sm font-medium text-main-black'>
        {label}
        <span className='text-main-primary'>*</span>
      </label>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={cn(
          'rounded-lg border bg-white px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 transition-colors focus:outline-none',
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-purple-92 focus:border-main-primary'
        )}
      />
      {error && <span className='text-xs text-red-500'>{error}</span>}
    </div>
  );
}

/* ─── Content Textarea ─── */

interface ListingContentTextareaProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  rows?: number;
}

export function ListingContentTextarea({
  value,
  onChange,
  label,
  placeholder,
  rows = 4,
}: ListingContentTextareaProps) {
  return (
    <div className='flex flex-col gap-2'>
      <label className='text-sm font-medium text-main-black'>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className='rounded-lg border border-purple-92 bg-white px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 transition-colors focus:border-main-primary focus:outline-none resize-none'
      />
    </div>
  );
}
