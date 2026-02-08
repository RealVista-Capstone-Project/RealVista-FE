import { ArrowLeft, Heart, Share2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Property } from '@/entities/property';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { Link } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';

export interface PropertyHeaderProps {
  property: Property;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  onBrowseNearby?: () => void;
}

export function PropertyHeader({
  property,
  onShare,
  onFavorite,
  isFavorite = false,
  onBrowseNearby,
}: PropertyHeaderProps) {
  const t = useTranslations('PropertyHeader');

  return (
    <div className='flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-col gap-2 min-w-0'>
        {/* Back to homepage link */}
        <Link
          href={ROUTES.homePage}
          className='flex items-center gap-2 text-main-primary hover:text-main-primary-hover transition-colors font-medium text-sm'
        >
          <ArrowLeft className='size-4' />
          <span>{t('backToHomepage')}</span>
        </Link>

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
        <RealVistaButton
          variant='secondary'
          size='medium'
          onClick={onShare}
          className='gap-2 w-full sm:w-auto'
        >
          <Share2 className='size-4' />
          {t('share')}
        </RealVistaButton>

        <RealVistaButton
          variant='secondary'
          size='medium'
          onClick={onFavorite}
          className={`gap-2 w-full sm:w-auto ${isFavorite ? 'bg-purple-92-hover' : ''}`}
        >
          <Heart className={`size-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
          <span>{isFavorite ? t('saved') : t('save')}</span>
        </RealVistaButton>

        {/* Browse Button nearby on sm and up */}
        <div className='hidden sm:block'>
          <RealVistaButton
            variant='secondary'
            size='medium'
            onClick={onBrowseNearby}
            className='gap-2 w-full sm:w-auto'
          >
            <Search className='size-4' />
            <span className='truncate'>{t('browseNearbyListings')}</span>
          </RealVistaButton>
        </div>
      </div>
    </div>
  );
}
