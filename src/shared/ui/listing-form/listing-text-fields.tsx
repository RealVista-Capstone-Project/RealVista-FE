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
  /** Smaller labels/inputs (create listing step 2 compact layout) */
  compact?: boolean;
}

export function ListingNameInput({
  value,
  onChange,
  label,
  placeholder,
  error,
  maxLength = 500,
  compact = false,
}: ListingNameInputProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
        {label}
        <span className='ml-0.5 text-red-500'>*</span>
      </label>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={cn(
          'rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
          error
            ? 'border-red-400 focus:border-red-500 focus-visible:ring-red-400/20'
            : 'border-primary/20 focus:border-primary focus-visible:ring-primary/20'
        )}
      />
      <div className='flex items-start justify-between gap-2'>
        {error ? (
          <span className='text-xs text-red-500'>{error}</span>
        ) : (
          <span />
        )}
        <span
          className={cn(
            'ml-auto shrink-0 text-xs tabular-nums',
            value.length >= maxLength ? 'text-red-500 font-medium' : 'text-muted-foreground/50'
          )}
        >
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

/* ─── Content Textarea ─── */

const MAX_CONTENT_LENGTH = 2000;

interface ListingContentTextareaProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  rows?: number;
  error?: string;
  compact?: boolean;
}

export function ListingContentTextarea({
  value,
  onChange,
  label,
  placeholder,
  rows = 4,
  error,
  compact = false,
}: ListingContentTextareaProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={MAX_CONTENT_LENGTH}
        className={cn(
          'rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 resize-none',
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
          error
            ? 'border-red-400 focus:border-red-500 focus-visible:ring-red-400/20'
            : 'border-primary/20 focus:border-primary focus-visible:ring-primary/20'
        )}
      />
      <div className='flex items-start justify-between gap-2'>
        {error ? (
          <span className='text-xs text-red-500'>{error}</span>
        ) : (
          <span />
        )}
        <span
          className={cn(
            'ml-auto shrink-0 text-xs tabular-nums',
            value.length >= MAX_CONTENT_LENGTH
              ? 'text-red-500 font-medium'
              : 'text-muted-foreground/50'
          )}
        >
          {value.length}/{MAX_CONTENT_LENGTH}
        </span>
      </div>
    </div>
  );
}
