'use client';

import { cn } from '@/shared/lib/utils';

export interface PropertyMapMarkerProps {
  price: number;
  currency?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PropertyMapMarker({
  price,
  currency = '$',
  isSelected = false,
  isHovered = false,
  onClick,
  className,
}: PropertyMapMarkerProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center rounded-lg bg-white px-3 py-1.5 shadow-md transition-all duration-200 hover:scale-110',
        'border-2',
        isSelected || isHovered ? 'border-main-primary bg-main-primary' : 'border-white',
        'cursor-pointer',
        className
      )}
    >
      <span
        className={cn(
          'text-sm font-bold leading-tight',
          isSelected || isHovered ? 'text-white' : 'text-main-black'
        )}
      >
        {currency}
        {price >= 1000 ? `${(price / 1000).toFixed(1)}k` : price.toLocaleString()}
      </span>
    </button>
  );
}
