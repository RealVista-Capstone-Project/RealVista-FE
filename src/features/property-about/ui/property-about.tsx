'use client';

import { InfoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Property } from '@/entities/property';
import type { Listing } from '@/entities/listing';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { RentalFeatures } from '@/features/rental-features';
import { PriceHistoryChart } from '@/features/listing';
import Image from 'next/image';
import { PropertyMapSection } from '@/widgets/property-map-section';
import { AttributeIcon } from '@/shared/ui/attribute-icon';

export interface PropertyAboutProps {
  property: Property;
}

/**
 * PropertyAbout component displays detailed property information
 * including specifications, description, owner info, features, and price history
 */
export function PropertyAbout({ property }: PropertyAboutProps) {
  const t = useTranslations('PropertyAbout');

  // Get attributes from property (optional field, may be undefined)
  const attributes = property.attributes ?? [];

  // Type guard to check if property has Listing-specific agent fields
  const hasListingAgent = (prop: Property | Listing): prop is Listing => {
    return 'avatar_url' in prop.agent || 'full_name' in prop.agent;
  };

  // Type guard to check if property has Listing-specific location fields
  const hasListingLocation = (prop: Property | Listing): prop is Listing => {
    return 'latitude' in prop.location || 'longitude' in prop.location;
  };

  return (
    <div className='flex flex-col gap-12 w-full max-w-[782px]'>
      {/* Specifications */}
      <div className='bg-white border border-purple-96 rounded-lg p-6'>
        {attributes.length > 0 ? (
          // Dynamic attributes from server - max 4 items per row
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6'>
            {attributes.map((attribute) => (
              <div key={attribute.attribute_id} className='flex flex-col gap-4'>
                <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
                  {attribute.attribute_name}
                </p>
                <div className='flex items-center gap-2'>
                  <AttributeIcon
                    iconName={attribute.icon}
                    className='size-6 text-main-black/50'
                    strokeWidth={2}
                  />
                  <p className='text-main-black font-bold leading-[1.45] tracking-[-0.09px]'>
                    {attribute.display_value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Fallback to hardcoded values for backward compatibility
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6'>
            {/* Status */}
            <div className='flex flex-col gap-4'>
              <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
                {t('status')}
              </p>
              <div className='flex items-center gap-2'>
                <AttributeIcon
                  iconName='CheckCircle'
                  className='size-6 text-main-black/50'
                  strokeWidth={2}
                />
                <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                  {t('active')}
                </p>
              </div>
            </div>

            {/* Repair Quality */}
            <div className='flex flex-col gap-4'>
              <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
                {t('repairQuality')}
              </p>
              <div className='flex items-center gap-2'>
                <AttributeIcon
                  iconName='Wrench'
                  className='size-6 text-main-black/50'
                  strokeWidth={2}
                />
                <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                  {t('modernLoft')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* About this home */}
      <div className='flex flex-col gap-8'>
        <h2 className='text-main-black text-[24px] font-bold leading-[1.5] tracking-[-0.24px]'>
          {t('aboutThisHome')}
        </h2>
        <p className='text-main-black/70 text-[16px] font-medium leading-[1.6]'>
          {property.description}
        </p>
      </div>

      {/* Owner */}
      <div className='bg-purple-98 border border-purple-92 rounded-lg p-6'>
        <div className='flex flex-col gap-6'>
          <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
            {t('listedByPropertyOwner')}
          </p>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='size-[64px] rounded-full overflow-hidden bg-grey-200 flex items-center justify-center'>
                {hasListingAgent(property) && property.agent.avatar_url ? (
                  <Image
                    src={property.agent.avatar_url}
                    alt={property.agent.full_name}
                    width={64}
                    height={64}
                    className='size-full object-cover'
                    onError={(e) => {
                      // Fallback to initials if image fails
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.textContent = property.agent.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();
                      }
                    }}
                  />
                ) : property.agent.avatar ? (
                  <Image
                    src={property.agent.avatar}
                    alt={property.agent.name}
                    width={64}
                    height={64}
                    className='size-full object-cover'
                    onError={(e) => {
                      // Fallback to initials if image fails
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.textContent = property.agent.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();
                      }
                    }}
                  />
                ) : (
                  <span className='text-main-black/50 text-lg font-semibold'>
                    {hasListingAgent(property)
                      ? property.agent.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : property.agent.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                  </span>
                )}
              </div>
              <div className='flex flex-col gap-[2px]'>
                <p className='text-main-black text-[16px] font-bold leading-[1.5]'>
                  {hasListingAgent(property) ? property.agent.full_name : property.agent.name}
                </p>
                <p className='text-main-black/50 text-[14px] font-medium leading-[1.4]'>
                  {hasListingAgent(property)
                    ? property.agent.business_name || t('realEstateAgency')
                    : t('realEstateAgency')}
                </p>
              </div>
            </div>
            <div className='flex gap-2'>
              <RealVistaButton variant='secondary' size='small'>
                {t('askAQuestion')}
              </RealVistaButton>
              <RealVistaButton variant='secondary' size='small'>
                <InfoIcon className='size-4' />
                {t('getMoreInfo')}
              </RealVistaButton>
            </div>
          </div>
        </div>
      </div>

      <div className='h-px w-full bg-purple-92' />

      {/* Rental Features */}
      <RentalFeatures property={property} />

      <div className='h-px w-full bg-purple-92' />
      <PriceHistoryChart listingId={property.id} />
      <div className='h-px w-full bg-purple-92' />

      {/* Map Section */}
      <PropertyMapSection
        location={
          hasListingLocation(property)
            ? { lat: property.location.latitude, lng: property.location.longitude }
            : property.location
        }
      />

      {/* Legal Disclaimer */}
      <p className='text-main-black/50 text-[14px] font-medium leading-[1.4]'>
        {t('legalDisclaimer')}
      </p>
    </div>
  );
}
