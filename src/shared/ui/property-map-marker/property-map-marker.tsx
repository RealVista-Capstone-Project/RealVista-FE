'use client';

import { cn } from '@/shared/lib/utils';

import { formatVND } from '@/shared/lib/utils/format-currency';
import { Flame } from 'lucide-react';

export interface PropertyMapMarkerProps {
  price?: number;
  label?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  isBoosted?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PropertyMapMarker({
  price = 0,
  label,
  isSelected = false,
  isHovered = false,
  isBoosted = false,
  onClick,
  className,
}: PropertyMapMarkerProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-1.5 shadow-md transition-all duration-200 hover:scale-110',
        'border-2',
        isSelected || isHovered
          ? 'border-primary bg-primary'
          : isBoosted
            ? 'border-orange-500 bg-white'
            : 'border-white',
        'cursor-pointer',
        className
      )}
    >
      {isBoosted && (
        <Flame
          className={cn(
            'h-4 w-4',
            isSelected || isHovered ? 'text-white' : 'text-orange-500'
          )}
          fill='currentColor'
        />
      )}
      <span
        className={cn(
          'text-sm font-bold leading-tight',
          isSelected || isHovered ? 'text-white' : 'text-foreground'
        )}
      >
        {label || formatVND(price ?? 0)}
      </span>
    </button>
  );
}
