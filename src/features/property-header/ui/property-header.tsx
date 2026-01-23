import { ArrowLeft, Heart, Share2, Search } from 'lucide-react';
import type { Property } from '@/entities/property';

import { RealVistaButton } from '@/shared/ui/real-vista-button';

export interface PropertyHeaderProps {
  property: Property;
  onBack?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  onBrowseNearby?: () => void;
}

export function PropertyHeader({
  property,
  onBack,
  onShare,
  onFavorite,
  isFavorite = false,
  onBrowseNearby,
}: PropertyHeaderProps) {
  return (
    <div className='flex items-center justify-between gap-6'>
      <div className='flex-col'>
        {/* Back to map link */}
        {onBack && (
          <button
            onClick={onBack}
            className='flex items-center gap-2 text-main-primary hover:text-main-primary-hover transition-colors font-medium text-sm'
          >
            <ArrowLeft className='size-4' />
            <span>Back to map</span>
          </button>
        )}

        {/* Property title and address */}
        <div className='flex flex-col gap-2'>
          <h1 className='text-[32px] font-bold leading-tight text-main-black'>{property.title}</h1>
          <p className='text-base text-grey-600'>{property.address}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex flex-wrap gap-3'>
        <RealVistaButton variant='secondary' size='medium' onClick={onShare} className='gap-2'>
          <Share2 className='size-4' />
          Share
        </RealVistaButton>

        <RealVistaButton
          variant='secondary'
          size='medium'
          onClick={onFavorite}
          className={`gap-2 ${isFavorite ? 'bg-purple-92-hover' : ''}`}
        >
          <Heart className={`size-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
          <span>{isFavorite ? 'Saved' : 'Save'}</span>
        </RealVistaButton>

        <RealVistaButton
          variant='secondary'
          size='medium'
          onClick={onBrowseNearby}
          className='gap-2'
        >
          <Search className='size-4' />
          <span>Browse nearby listings</span>
        </RealVistaButton>
      </div>
    </div>
  );
}
