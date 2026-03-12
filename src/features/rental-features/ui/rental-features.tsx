'use client';

import { useTranslations } from 'next-intl';
import type { Property } from '@/entities/property';
import type { Amenity } from '@/entities/listing';

export interface RentalFeaturesProps {
  property: Property;
}

/**
 * RentalFeatures component displays property amenities
 * split into On-site and Off-site sections with bullet lists
 * - Mobile: single column per section
 * - Desktop: two column grid per section
 */
export function RentalFeatures({ property }: RentalFeaturesProps) {
  const t = useTranslations('RentalFeatures');
  const amenities: Amenity[] = property.amenities || [];

  if (amenities.length === 0) {
    return null;
  }

  // Split amenities into on-site and off-site
  const onSiteAmenities = amenities.filter((a) => a.is_onsite);
  const offSiteAmenities = amenities.filter((a) => a.is_offsite);

  return (
    <div className='flex flex-col gap-6'>
      {/* Title */}
      <h2 className='text-main-black text-xl sm:text-2xl font-bold leading-[1.5] tracking-[-0.24px]'>
        {t('title')}
      </h2>

      {/* On-site Amenities */}
      {onSiteAmenities.length > 0 && (
        <AmenitySection title={t('onSite')} amenities={onSiteAmenities} />
      )}

      {/* Off-site Amenities */}
      {offSiteAmenities.length > 0 && (
        <AmenitySection title={t('offSite')} amenities={offSiteAmenities} />
      )}
    </div>
  );
}

/**
 * Amenity section with title and bullet list
 */
function AmenitySection({ title, amenities }: { title: string; amenities: Amenity[] }) {
  return (
    <div className='flex flex-col gap-3'>
      {/* Section Title */}
      <h3 className='text-main-black text-base sm:text-lg font-bold'>{title}</h3>

      {/* Amenity List Card */}
      <div className='bg-purple-98/84 rounded-lg p-4 sm:p-6'>
        {/* Mobile: Single column bullet list */}
        <ul className='sm:hidden flex flex-col gap-2'>
          {amenities.map((amenity) => (
            <li key={amenity.amenity_id} className='flex items-center gap-2'>
              <span className='text-grey-600'>•</span>
              <span className='text-grey-600 text-base font-medium'>
                {amenity.amenity_name}
              </span>
            </li>
          ))}
        </ul>

        {/* Desktop: Two column bullet list */}
        <ul className='hidden sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-2'>
          {amenities.map((amenity) => (
            <li key={amenity.amenity_id} className='flex items-center gap-2'>
              <span className='text-grey-600'>•</span>
              <span className='text-grey-600 text-base font-medium'>
                {amenity.amenity_name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
