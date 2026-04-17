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
      <label className='text-sm font-medium text-foreground'>
        {label}
        <span className='text-primary'>*</span>
      </label>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={cn(
          'rounded-lg border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-none',
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-primary/20 focus:border-primary'
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
      <label className='text-sm font-medium text-foreground'>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className='rounded-lg border border-primary/20 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:outline-none resize-none'
      />
    </div>
  );
}
