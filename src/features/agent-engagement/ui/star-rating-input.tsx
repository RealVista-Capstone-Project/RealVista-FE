'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface StarRatingInputProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const labelMap: Record<number, { en: string; vi: string }> = {
  1: { en: 'Terrible', vi: 'Rất tệ' },
  2: { en: 'Bad', vi: 'Tệ' },
  3: { en: 'Okay', vi: 'Bình thường' },
  4: { en: 'Good', vi: 'Tốt' },
  5: { en: 'Excellent', vi: 'Xuất sắc' },
};

export function StarRatingInput({
  value,
  onChange,
  readonly = false,
  size = 'md',
  className,
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);

  const displayValue = readonly ? value : hovered || value;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className='flex items-center gap-1'
        onMouseLeave={() => !readonly && setHovered(0)}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= displayValue;
          return (
            <button
              key={i}
              type='button'
              disabled={readonly}
              aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
              className={cn(
                'transition-transform duration-100',
                !readonly && 'hover:scale-110 cursor-pointer',
                readonly && 'cursor-default'
              )}
              onMouseEnter={() => !readonly && setHovered(starValue)}
              onClick={() => !readonly && onChange?.(starValue)}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  'transition-colors duration-100',
                  isFilled
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200 fill-gray-200'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Label under stars */}
      {!readonly && displayValue > 0 && (
        <span className='text-xs font-medium text-primary transition-all duration-150'>
          {labelMap[displayValue]?.vi}
        </span>
      )}
    </div>
  );
}
