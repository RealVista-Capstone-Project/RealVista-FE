'use client';

import { GoogleMap } from '@/shared/ui/map/google-map';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface PropertyMapSectionProps {
  location: {
    lat: number;
    lng: number;
  };
  onOpenGoogleMaps?: () => void;
  onOpenStreetView?: () => void;
}

/**
 * PropertyMapSection widget displays property location on Google Maps
 * with Street View functionality
 */
export function PropertyMapSection({
  location,
  onOpenGoogleMaps,
  onOpenStreetView,
}: PropertyMapSectionProps) {
  const t = useTranslations('PropertyDetail');

  const handleOpenGoogleMaps = () => {
    if (onOpenGoogleMaps) {
      onOpenGoogleMaps();
    } else {
      // Default: open in new tab
      const url = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStreetView = () => {
    if (onOpenStreetView) {
      onOpenStreetView();
    } else {
      // Default: open Street View in new tab
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className='flex flex-col gap-6 sm:gap-8'>
      {/* Section Title */}
      <h2 className='text-main-black text-xl sm:text-2xl font-bold leading-[1.5] tracking-[-0.24px]'>
        {t('map')}
      </h2>

      {/* Map Container */}
      <div className='relative w-full h-[300px] sm:h-[400px] md:h-[300px] rounded-lg overflow-hidden'>
        <GoogleMap defaultCenter={location} defaultZoom={15} className='w-full h-full' />

        {/* Bottom Buttons - Side by Side */}
        <div className='absolute bottom-4 left-4 flex items-center gap-2'>
          {/* Open Google Maps Button */}
          <button
            onClick={handleOpenGoogleMaps}
            className='flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors shadow-md text-xs sm:text-sm font-bold leading-[1.5]'
          >
            <MapPin className='size-4' strokeWidth={2.5} />
            <span className='hidden sm:inline'>{t('openGoogleMaps')}</span>
            <span className='sm:hidden'>{t('openMaps')}</span>
          </button>

          {/* Street View Button */}
          <button
            onClick={handleStreetView}
            className='flex items-center gap-2 bg-white hover:bg-purple-98 border-[1.5px] border-purple-92 text-main-black px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors shadow-sm text-xs sm:text-sm font-bold leading-[1.5]'
          >
            {/* Street View Icon */}
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='size-4'
            >
              <path
                d='M8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8Z'
                fill='currentColor'
              />
              <path
                d='M8 10C6.34315 10 5 11.3431 5 13V14H11V13C11 11.3431 9.65685 10 8 10Z'
                fill='currentColor'
              />
            </svg>
            <span className='hidden sm:inline'>{t('streetView')}</span>
            <span className='sm:hidden'>{t('streetViewShort')}</span>
          </button>
        </div>
      </div>

      {/* See More Listings Link */}
      <a
        href='#'
        className='text-primary text-sm sm:text-base font-medium leading-[1.5] hover:underline inline-flex items-center gap-1'
      >
        {t('seeMoreListings')}
        <svg
          width='20'
          height='20'
          viewBox='0 0 20 20'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='size-4 sm:size-5'
        >
          <path
            d='M7.5 15L12.5 10L7.5 5'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </a>
    </div>
  );
}
