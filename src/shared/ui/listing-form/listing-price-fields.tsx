'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { formatVND, formatNumber } from '@/shared/lib/utils/format-currency';
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
}: CurrencyInputProps) {
  const [focused, setFocused] = React.useState(false);

  // While focused: show raw digits. While blurred: show formatted with dot separators.
  const numericValue = value.replace(/\D/g, '');
  const displayValue = focused || !numericValue ? value : formatNumber(Number(numericValue));

  // Helper text: e.g. "2 tỷ VNĐ" or "500 triệu VNĐ"
  const helperText = React.useMemo(() => {
    const n = Number(numericValue);
    if (!numericValue || !Number.isFinite(n) || n <= 0) return null;
    return `${formatVND(n)} VNĐ`;
  }, [numericValue]);

  return (
    <div className={cn('flex flex-col gap-2', disabled && 'opacity-50', className)}>
      <label className='text-sm font-medium text-foreground'>
        {label}
        {required && <span className='text-primary'>*</span>}
      </label>
      <div className={cn(
        'flex items-center rounded-lg border border-primary/20 bg-background overflow-hidden transition-colors',
        !disabled && 'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1'
      )}>
        <span className='flex h-full items-center border-r border-primary/20 bg-primary/5 px-3 text-sm text-muted-foreground/70'>
          {currency}
        </span>
        <input
          type='text'
          inputMode='numeric'
          value={displayValue}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            onChange(raw);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none bg-transparent',
            error && 'text-red-500',
            disabled && 'cursor-not-allowed'
          )}
        />
      </div>
      {helperText && !error && (
        <span className='text-xs text-muted-foreground'>{helperText}</span>
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
}

export function NegotiableToggle({ value, onChange, label }: NegotiableToggleProps) {
  return (
    <div className='flex items-center justify-between'>
      <span className='text-sm font-medium text-foreground'>{label}</span>
      <button
        type='button'
        role='switch'
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          value ? 'bg-primary' : 'bg-primary/20'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
            value ? 'translate-x-5' : 'translate-x-0'
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
  };
}

/**
 * Composite component handling all pricing-related fields:
 * price, security deposit (rent only), min/max price, and negotiable toggle.
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
}: ListingPriceFieldsProps) {
  return (
    <>
      {/* Price + Security Deposit */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <CurrencyInput
          value={price}
          onChange={onPriceChange}
          label={listingType === 'RENT' ? labels.priceRent : labels.priceSale}
          placeholder={labels.pricePlaceholder}
          error={errors.price}
          required
          className={listingType === 'SALE' ? 'sm:col-span-2' : undefined}
        />
        {listingType === 'RENT' && (
          <CurrencyInput
            value={securityDeposit}
            onChange={onSecurityDepositChange}
            label={labels.securityDeposit}
            placeholder={labels.pricePlaceholder}
          />
        )}
      </div>

      {/* Min / Max Price */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <CurrencyInput
          value={minPrice}
          onChange={onMinPriceChange}
          label={labels.minPrice}
          placeholder={labels.pricePlaceholder}
          error={errors.minPrice}
          required
        />
        <CurrencyInput
          value={maxPrice}
          onChange={onMaxPriceChange}
          label={labels.maxPrice}
          placeholder={labels.pricePlaceholder}
          error={errors.maxPrice}
          required
        />
      </div>

      {/* Negotiable */}
      <NegotiableToggle
        value={isNegotiable}
        onChange={onNegotiableChange}
        label={labels.negotiable}
      />
    </>
  );
}
