'use client';

import { Bath, Bed, CheckCircle, InfoIcon, Ruler, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Property } from '@/entities/property';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { RentPriceHistory } from '@/features/rent-price-history';
import { RentalFeatures } from '@/features/rental-features';
import Image from 'next/image';

export interface PropertyAboutProps {
  property: Property;
}

/**
 * PropertyAbout component displays detailed property information
 * including specifications, description, owner info, features, and price history
 */
export function PropertyAbout({ property }: PropertyAboutProps) {
  const t = useTranslations('PropertyAbout');
  console.log(property);

  return (
    <div className='flex flex-col gap-12 w-full max-w-[782px]'>
      {/* Specifications */}
      <div className='bg-white border border-purple-96 rounded-lg p-6'>
        <div className='flex flex-wrap gap-x-8 gap-y-6 justify-between'>
          {/* Square Area */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
              {t('squareArea')}
            </p>
            <div className='flex items-center gap-2'>
              <Ruler className='size-6 text-main-black/50' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                {property.area} m²
              </p>
            </div>
          </div>

          {/* Bedrooms */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
              {t('bedrooms')}
            </p>
            <div className='flex items-center gap-2'>
              <Bed className='size-6 text-main-black/50' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                {property.bedrooms}
              </p>
            </div>
          </div>

          {/* Bathrooms */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
              {t('bathrooms')}
            </p>
            <div className='flex items-center gap-2'>
              <Bath className='size-6 text-main-black/50' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                {property.bathrooms}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
              {t('status')}
            </p>
            <div className='flex items-center gap-2'>
              <CheckCircle className='size-6 text-main-black/50' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                {t('active')}
              </p>
            </div>
          </div>

          {/* Repair Quality */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
              {t('repairQuality')}
            </p>
            <div className='flex items-center gap-2'>
              <Wrench className='size-6 text-main-black/50' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                {t('modernLoft')}
              </p>
            </div>
          </div>
        </div>
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
                {property.agent.avatar ? (
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
                    {property.agent.name
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
                  {property.agent.name}
                </p>
                <p className='text-main-black/50 text-[14px] font-medium leading-[1.4]'>
                  {t('realEstateAgency')}
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

      {/* Rent Price History */}
      <RentPriceHistory property={property} />

      {/* Legal Disclaimer */}
      <p className='text-main-black/50 text-[14px] font-medium leading-[1.4]'>
        {t('legalDisclaimer')}
      </p>
    </div>
  );
}
