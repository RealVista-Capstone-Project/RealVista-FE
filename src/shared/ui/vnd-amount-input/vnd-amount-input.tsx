'use client';

import * as React from 'react';
import {
  digitsToVndInteger,
  formatVndDigitsForDisplay,
  sanitizeVndDigits,
  vndIntegerToDigitString,
} from '@/shared/lib/utils/vnd-input';
import { cn } from '@/shared/lib/utils/cn';
import { formatVND } from '@/shared/lib/utils/format-currency';

export interface VndAmountInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  value: number;
  onChange: (amountVnd: number) => void;
  max?: number;
  inputClassName?: string;
  error?: boolean;
  /** Shown when value > 0; defaults to formatVND(value). */
  previewText?: string;
  /** Hide the human-readable preview line. */
  hidePreview?: boolean;
}

export function VndAmountInput({
  value,
  onChange,
  max,
  className,
  inputClassName,
  error,
  disabled,
  placeholder,
  id,
  previewText,
  hidePreview,
  onKeyDown,
  ...props
}: VndAmountInputProps) {
  const [digits, setDigits] = React.useState(() => vndIntegerToDigitString(value));

  React.useEffect(() => {
    setDigits(vndIntegerToDigitString(value));
  }, [value]);

  const handleChange = (raw: string) => {
    const nextDigits = sanitizeVndDigits(raw);
    const parsed = digitsToVndInteger(nextDigits);
    const maxAllowed = typeof max === "number" && Number.isFinite(max) ? Math.max(0, max) : null;
    const normalized = maxAllowed == null ? parsed : Math.min(parsed, maxAllowed);
    setDigits(vndIntegerToDigitString(normalized));
    onChange(normalized);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent characters that are definitely not for price (., -, e, +, etc)
    if (['.', '-', 'e', '+', ','].includes(e.key)) {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  const amount = digitsToVndInteger(digits);
  const preview =
    previewText ?? (amount > 0 ? `≈ ${formatVND(amount)}` : '');

  return (
    <div className={cn('relative', className)}>
      <input
        id={id}
        type='text'
        inputMode='numeric'
        autoComplete='off'
        disabled={disabled}
        placeholder={placeholder}
        value={formatVndDigitsForDisplay(digits)}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-invalid={error}
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          !inputClassName?.includes('h-') && 'h-9',
          error && 'border-destructive ring-destructive/20',
          'pr-12',
          inputClassName
        )}
        {...props}
      />
      <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-[10px] font-bold text-muted-foreground/60'>
        VNĐ
      </span>
      {!hidePreview && preview ? (
        <p className='mt-1 text-[10px] text-muted-foreground leading-tight'>{preview}</p>
      ) : null}
    </div>
  );
}
