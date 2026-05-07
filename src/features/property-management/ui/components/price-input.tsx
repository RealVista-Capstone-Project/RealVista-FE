'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { toVietnameseWords, MAX_VIETNAMESE_PRICE_DIGITS } from '@/shared/lib/utils/vietnamese-number-words';

export function PriceInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder,
  currencySymbol = '₫',
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  /** Same prefix as listing form (`CurrencyInput`) */
  currencySymbol?: string;
}) {
  const fmt = (n: number | undefined) =>
    n != null ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

  const [display, setDisplay] = useState(() => fmt(value));
  const isEditing = useRef(false);

  useEffect(() => {
    if (!isEditing.current) {
      setDisplay(fmt(value));
    }
  }, [value]);

  const rawNum = Number(display.replace(/\./g, ''));
  const words = display && !isNaN(rawNum) && rawNum > 0 ? toVietnameseWords(rawNum) : '';

  return (
    <div className='flex flex-col gap-1'>
      <div
        className={cn(
          'flex h-12 items-center overflow-hidden rounded-lg border border-primary/20 bg-background transition-colors',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          className
        )}
      >
        <span className='flex h-full shrink-0 items-center border-r border-primary/20 bg-primary/5 px-3 text-sm select-none text-muted-foreground/70'>
          {currencySymbol}
        </span>
        <input
          type='text'
          inputMode='numeric'
          placeholder={placeholder}
          value={display}
          maxLength={MAX_VIETNAMESE_PRICE_DIGITS + 4}
          onFocus={() => {
            isEditing.current = true;
          }}
          onBlur={() => {
            isEditing.current = false;
            onBlur?.();
          }}
          onChange={(e) => {
            let raw = e.target.value.replace(/\D/g, '');
            raw = raw.replace(/^0+(\d)/, '$1');
            raw = raw.slice(0, MAX_VIETNAMESE_PRICE_DIGITS);
            setDisplay(raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '');
            onChange(raw === '' ? undefined : Number(raw));
          }}
          className='h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-0'
        />
      </div>
      {words ? <span className='text-xs italic text-muted-foreground'>{words}</span> : null}
    </div>
  );
}
