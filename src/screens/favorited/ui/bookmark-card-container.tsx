'use client';

import {
  RealVistaListingCard,
  type RealVistaListingCardProps,
} from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';

interface BookmarkCardContainerProps extends RealVistaListingCardProps {
  isSelectionMode?: boolean;
  isSelected?: boolean;
  /** When true and not selected, user already picked 2 listings — block adding another */
  compareSelectDisabled?: boolean;
  /** Sold (or otherwise not comparable) — checkbox disabled */
  compareUnavailable?: boolean;
  onSelectionChange?: (id: string, isSelected: boolean) => void;
}

export function BookmarkCardContainer({
  id,
  isSelectionMode = false,
  isSelected = false,
  compareSelectDisabled = false,
  compareUnavailable = false,
  statusTag,
  onSelectionChange,
  onToggleFavorite,
  ...cardProps
}: BookmarkCardContainerProps) {
  const t = useTranslations('Favorited');

  /** Không hiện ô so sánh khi đã bán (trùng với badge Đã bán trên card) */
  const hideCompareCheckbox = compareUnavailable || statusTag === 'SOLD';

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hideCompareCheckbox) return;
    if (!isSelected && compareSelectDisabled) return;
    onSelectionChange?.(id, !isSelected);
  };

  const compareDisabled = !isSelected && compareSelectDisabled;

  const handleCardToggleFavorite = (cardId: string) => {
    onToggleFavorite?.(cardId);
  };

  return (
    <div className='relative overflow-hidden rounded-xl shadow-sm ring-1 ring-neutral-200/70 transition-shadow hover:shadow-md'>
      {/* Card */}
      <RealVistaListingCard
        id={id}
        statusTag={statusTag}
        {...cardProps}
        compact
        onToggleFavorite={handleCardToggleFavorite}
      />

      {/* Compare: chỉ ô vuông tick — ẩn hẳn với tin đã bán */}
      {isSelectionMode && !hideCompareCheckbox && (
        <button
          type='button'
          onClick={handleCheckboxChange}
          disabled={compareDisabled}
          className={cn(
            'absolute left-3 top-3 z-20 flex size-6 items-center justify-center rounded-sm border-2 shadow-md transition-colors',
            isSelected
              ? 'border-primary bg-primary'
              : 'border-white bg-black/30',
            compareDisabled && 'cursor-not-allowed opacity-50'
          )}
          aria-label={isSelected ? t('compareSelected') : t('compareAdd')}
        >
          {isSelected && <Check className='size-3.5 text-white' strokeWidth={3} />}
        </button>
      )}
    </div>
  );
}
