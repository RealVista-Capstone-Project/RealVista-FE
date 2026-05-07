'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import { formatNumber } from '@/shared/lib/utils/format-currency';
import {
  MAX_VIETNAMESE_PRICE_DIGITS,
  toVietnameseWords,
} from '@/shared/lib/utils/vietnamese-number-words';
import type { ListingType } from '@/entities/listing';

/* ─── Currency Input ─── */

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  error?: string;
  required?: boolean;
  currency?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  placeholder,
  error,
  required = false,
  currency = '₫',
  disabled = false,
  className,
  compact = false,
}: CurrencyInputProps) {
  const locale = useLocale();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const numericValue = value.replace(/\D/g, '');
  // Always show dot-separated format while typing
  const displayValue = numericValue ? formatNumber(Number(numericValue)) : '';

  // Spoken amount — same pattern as create-property PriceInput (vi: đọc thành lời)
  const helperText = React.useMemo(() => {
    const n = Number(numericValue);
    if (!numericValue || !Number.isFinite(n) || n <= 0) return null;
    if (locale === 'vi') return toVietnameseWords(n);
    return `${n.toLocaleString('en-US')} VND`;
  }, [numericValue, locale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const selectionEnd = inputEl.selectionEnd ?? 0;

    // Count how many digits appear before the cursor in the current displayed string
    const digitsBeforeCursor = inputEl.value.slice(0, selectionEnd).replace(/\D/g, '').length;

    const raw = inputEl.value.replace(/\D/g, '').slice(0, MAX_VIETNAMESE_PRICE_DIGITS);
    onChange(raw);

    // After React re-renders with the new formatted value, restore cursor position
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const newFormatted = raw ? formatNumber(Number(raw)) : '';
      let digitCount = 0;
      let newPos = newFormatted.length;
      for (let i = 0; i < newFormatted.length; i++) {
        if (/\d/.test(newFormatted[i])) {
          digitCount++;
          if (digitCount === digitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }
      }
      inputRef.current.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <div className={cn('flex flex-col gap-1.5', disabled && 'opacity-50', className)}>
      <label className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
        {label}
        {required && <span className='ml-0.5 text-red-500'>*</span>}
      </label>
      <div
        className={cn(
          'flex items-center rounded-lg border bg-background overflow-hidden transition-colors',
          error
            ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-400/20'
            : 'border-primary/20 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          disabled && 'cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'flex h-full items-center border-r border-primary/20 bg-primary/5 select-none text-muted-foreground/70',
            compact ? 'px-2 py-2 text-xs' : 'px-3 py-3 text-sm'
          )}
        >
          {currency}
        </span>
        <input
          ref={inputRef}
          type='text'
          inputMode='numeric'
          maxLength={MAX_VIETNAMESE_PRICE_DIGITS + 4}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 text-foreground placeholder:text-muted-foreground/50 focus:outline-none bg-transparent',
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
            disabled && 'cursor-not-allowed'
          )}
        />
      </div>
      {/* Helper price text — shown when value is valid and no error */}
      {helperText && !error && (
        <span className='text-xs text-muted-foreground italic'>{helperText}</span>
      )}
      {error && <span className='text-xs text-red-500'>{error}</span>}
    </div>
  );
}

/* ─── Negotiable Toggle ─── */

interface NegotiableToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  compact?: boolean;
}

export function NegotiableToggle({ value, onChange, label, compact = false }: NegotiableToggleProps) {
  return (
    <div className='flex items-center justify-between'>
      <span className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
        {label}
      </span>
      <button
        type='button'
        role='switch'
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          compact ? 'h-5 w-9' : 'h-6 w-11',
          value ? 'bg-primary' : 'bg-primary/20'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-lg transition-transform',
            compact ? 'h-4 w-4' : 'h-5 w-5',
            value ? (compact ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

/* ─── Price Fields Composite ─── */

interface ListingPriceFieldsProps {
  listingType: ListingType;
  price: string;
  onPriceChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  securityDeposit: string;
  onSecurityDepositChange: (value: string) => void;
  isNegotiable: boolean;
  onNegotiableChange: (value: boolean) => void;
  errors: Record<string, string>;
  labels: {
    priceRent: string;
    priceSale: string;
    pricePlaceholder: string;
    securityDeposit: string;
    minPrice: string;
    maxPrice: string;
    negotiable: string;
    priceRangeHint?: string;
  };
  compact?: boolean;
  /** Expected price from property profile (create listing hint) */
  propertyOwnerPriceHint?: string | null;
}
/**
 * Composite component handling all pricing-related fields:
 * price (required), security deposit (rent only), optional min/max price range,
 * and negotiable toggle.
 */
export function ListingPriceFields({
  listingType,
  price,
  onPriceChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  securityDeposit,
  onSecurityDepositChange,
  isNegotiable,
  onNegotiableChange,
  errors,
  labels,
  compact = false,
  propertyOwnerPriceHint = null,
}: ListingPriceFieldsProps) {
  const gridGap = compact ? 'gap-3' : 'gap-4';

  React.useEffect(() => {
    if (isNegotiable) return;
    if (minPrice !== price) onMinPriceChange(price);
    if (maxPrice !== price) onMaxPriceChange(price);
  }, [isNegotiable, price, minPrice, maxPrice, onMinPriceChange, onMaxPriceChange]);

  return (
    <>
      {/* Main price + Security Deposit */}
      <div className={cn('grid grid-cols-1 sm:grid-cols-2', gridGap)}>
        <CurrencyInput
          value={price}
          onChange={onPriceChange}
          label={listingType === 'RENT' ? labels.priceRent : labels.priceSale}
          placeholder={labels.pricePlaceholder}
          error={errors.price}
          required
          compact={compact}
          className={listingType === 'SALE' ? 'sm:col-span-2' : undefined}
        />
        {listingType === 'RENT' && (
          <CurrencyInput
            value={securityDeposit}
            onChange={onSecurityDepositChange}
            label={labels.securityDeposit}
            placeholder={labels.pricePlaceholder}
            error={errors.securityDeposit}
            compact={compact}
          />
        )}
      </div>

      {propertyOwnerPriceHint ? (
        <p
          className={cn(
            'rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-primary/90',
            compact ? 'text-xs leading-snug' : 'text-sm',
          )}
        >
          {propertyOwnerPriceHint}
        </p>
      ) : null}

      <NegotiableToggle
        value={isNegotiable}
        onChange={onNegotiableChange}
        label={labels.negotiable}
        compact={compact}
      />

      {isNegotiable ? (
        <div className='flex flex-col gap-2'>
          {labels.priceRangeHint ? (
            <p
              className={cn(
                'text-muted-foreground/70',
                compact ? 'text-xs leading-snug' : 'text-sm'
              )}
            >
              {labels.priceRangeHint}
            </p>
          ) : null}
          <div className={cn('grid grid-cols-1 sm:grid-cols-2', gridGap)}>
            <CurrencyInput
              value={minPrice}
              onChange={onMinPriceChange}
              label={labels.minPrice}
              placeholder={labels.pricePlaceholder}
              error={errors.minPrice}
              compact={compact}
            />
            <CurrencyInput
              value={maxPrice}
              onChange={onMaxPriceChange}
              label={labels.maxPrice}
              placeholder={labels.pricePlaceholder}
              error={errors.maxPrice}
              compact={compact}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
