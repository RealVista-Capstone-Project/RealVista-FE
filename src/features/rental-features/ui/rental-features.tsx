'use client';

import { useTranslations } from 'next-intl';
import type { Property } from '@/entities/property';
import type { Amenity } from '@/entities/listing';
import { Check } from 'lucide-react';

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
      <h2 className='text-foreground text-xl sm:text-2xl font-bold leading-[1.5] tracking-[-0.24px]'>
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
    <div className='flex flex-col gap-4'>
      {/* Section Title */}
      <h3 className='text-foreground text-lg sm:text-xl font-bold tracking-tight'>{title}</h3>

      {/* Amenity Grid */}
      <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4'>
        {amenities.map((amenity) => (
          <li key={amenity.amenity_id} className='flex items-start gap-3'>
            <div className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <Check className='h-3.5 w-3.5' strokeWidth={3} />
            </div>
            <span className='text-muted-foreground text-base font-medium leading-relaxed'>
              {amenity.amenity_name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
