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

export interface VndAmountInputProps {
  value: number;
  onChange: (amountVnd: number) => void;
  className?: string;
  inputClassName?: string;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  /** Shown when value &gt; 0; defaults to formatVND(value). */
  previewText?: string;
  /** Hide the human-readable preview line. */
  hidePreview?: boolean;
}

export function VndAmountInput({
  value,
  onChange,
  className,
  inputClassName,
  error,
  disabled,
  placeholder,
  id,
  previewText,
  hidePreview,
}: VndAmountInputProps) {
  const [digits, setDigits] = React.useState(() => vndIntegerToDigitString(value));

  React.useEffect(() => {
    setDigits(vndIntegerToDigitString(value));
  }, [value]);

  const handleChange = (raw: string) => {
    const nextDigits = sanitizeVndDigits(raw);
    setDigits(nextDigits);
    onChange(digitsToVndInteger(nextDigits));
  };

  const amount = digitsToVndInteger(digits);
  const preview =
    previewText ?? (amount > 0 ? `≈ ${formatVND(amount)}` : '');

  return (
    <div className={className}>
      <div className='relative'>
        <input
          id={id}
          type='text'
          inputMode='numeric'
          autoComplete='off'
          disabled={disabled}
          placeholder={placeholder}
          value={formatVndDigitsForDisplay(digits)}
          onChange={(e) => handleChange(e.target.value)}
          className={cn('pr-14', inputClassName)}
        />
        <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs font-semibold text-slate-400'>
          VND
        </span>
      </div>
      {!hidePreview && preview ? (
        <p className='mt-1 text-[10px] text-slate-500 leading-tight'>{preview}</p>
      ) : null}
    </div>
  );
}
