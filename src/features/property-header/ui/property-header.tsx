'use client';

import { ArrowLeft, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Property } from '@/entities/property';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { useRouter } from '@/shared/config/i18n/navigation';
import { SharePopover } from './share-popover';
import { useMemo } from 'react';

export interface PropertyHeaderProps {
  property: Property;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function PropertyHeader({
  property,
  onFavorite,
  isFavorite = false,
}: PropertyHeaderProps) {
  const t = useTranslations('PropertyHeader');
  const router = useRouter();

  // Get the share URL (current page URL)
  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  }, []);

  return (
    <div className='flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-col gap-2 min-w-0'>
        {/* Back button */}
        <button
          type='button'
          onClick={() => router.back()}
          className='flex items-center gap-2 text-primary hover:text-primary-hover transition-colors font-medium text-sm'
        >
          <ArrowLeft className='size-4' />
        </button>

        {/* Property title and address */}
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl sm:text-3xl font-bold leading-tight text-main-black break-words'>
            {property.title}
          </h1>
          <p className='text-sm sm:text-base text-grey-600 break-words'>{property.address}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className='grid grid-cols-2 gap-3 pt-3 sm:pt-0 sm:flex sm:flex-row sm:justify-end sm:flex-wrap sm:gap-3 w-full sm:w-auto'>
        <SharePopover url={shareUrl} title={property.title} />

        <RealVistaButton
          variant='secondary'
          size='medium'
          onClick={onFavorite}
          className={`gap-2 w-full sm:w-auto ${isFavorite ? 'bg-purple-92-hover' : ''}`}
        >
          <Heart className={`size-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
          <span>{isFavorite ? t('saved') : t('save')}</span>
        </RealVistaButton>
      </div>
    </div>
  );
}
