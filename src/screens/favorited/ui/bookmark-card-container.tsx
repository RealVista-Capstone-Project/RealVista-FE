'use client';

import {
  RealVistaListingCard,
  type RealVistaListingCardProps,
} from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { Check } from 'lucide-react';

interface BookmarkCardContainerProps extends RealVistaListingCardProps {
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (id: string, isSelected: boolean) => void;
}

export function BookmarkCardContainer({
  id,
  isSelectionMode = false,
  isSelected = false,
  onSelectionChange,
  onToggleFavorite,
  ...cardProps
}: BookmarkCardContainerProps) {
  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange?.(id, !isSelected);
  };

  const handleCardToggleFavorite = (cardId: string) => {
    onToggleFavorite?.(cardId);
  };

  return (
    <div className='relative'>
      {/* Card */}
      <RealVistaListingCard id={id} {...cardProps} onToggleFavorite={handleCardToggleFavorite} />

      {/* Selection Checkbox - Only show in selection mode */}
      {isSelectionMode && (
        <button
          onClick={handleCheckboxChange}
          className={`absolute top-4 left-4 flex h-6 w-6 items-center justify-center rounded border-2 transition-colors ${isSelected
              ? 'border-primary bg-primary'
              : 'border-white bg-white/80 hover:bg-white'
            }`}
          aria-label={isSelected ? 'Unselect' : 'Select'}
        >
          {isSelected && <Check className='h-4 w-4 text-white' strokeWidth={3} />}
        </button>
      )}
    </div>
  );
}
