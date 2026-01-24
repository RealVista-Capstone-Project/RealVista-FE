'use client';

import { Bath, Bed, CheckCircle, InfoIcon, Ruler, Wrench } from 'lucide-react';
import { Property } from '@/entities/property';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { RentPriceHistory } from '@/features/rent-price-history';
import { RentalFeatures } from '@/features/rental-features';

export interface PropertyAboutProps {
  property: Property;
}

/**
 * PropertyAbout component displays detailed property information
 * including specifications, description, owner info, features, and price history
 */
export function PropertyAbout({ property }: PropertyAboutProps) {
  return (
    <div className='flex flex-col gap-12 w-full max-w-[782px]'>
      {/* Specifications */}
      <div className='bg-white border border-purple-96 rounded-lg p-6'>
        <div className='flex flex-wrap gap-x-8 gap-y-6 justify-between'>
          {/* Square Area */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>Square Area</p>
            <div className='flex items-center gap-2'>
              <Ruler className='size-6 text-main-black' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                {property.area} m²
              </p>
            </div>
          </div>

          {/* Bedrooms */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>Bedrooms</p>
            <div className='flex items-center gap-2'>
              <Bed className='size-6 text-main-black' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                {property.bedrooms}
              </p>
            </div>
          </div>

          {/* Bathrooms */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>Bathrooms</p>
            <div className='flex items-center gap-2'>
              <Bath className='size-6 text-main-black' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                {property.bathrooms}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>Status</p>
            <div className='flex items-center gap-2'>
              <CheckCircle className='size-6 text-main-black' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                Active
              </p>
            </div>
          </div>

          {/* Repair Quality */}
          <div className='flex flex-col gap-4 min-w-[100px]'>
            <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
              Repair Quality
            </p>
            <div className='flex items-center gap-2'>
              <Wrench className='size-6 text-main-black' strokeWidth={2} />
              <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                Modern Loft
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About this home */}
      <div className='flex flex-col gap-8'>
        <h2 className='text-main-black text-[24px] font-bold leading-[1.5] tracking-[-0.24px]'>
          About this home
        </h2>
        <p className='text-main-black/70 text-[16px] font-medium leading-[1.6]'>
          {property.description}
        </p>
      </div>

      {/* Owner */}
      <div className='bg-purple-98 border border-purple-92 rounded-lg p-6'>
        <div className='flex flex-col gap-6'>
          <p className='text-main-black/50 text-[16px] font-medium leading-[1.5]'>
            Listed by property owner
          </p>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='size-[64px] rounded-full overflow-hidden bg-grey-200'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={property.agent.avatar}
                  alt={property.agent.name}
                  className='size-full object-cover'
                />
              </div>
              <div className='flex flex-col gap-[2px]'>
                <p className='text-main-black text-[16px] font-bold leading-[1.5]'>
                  {property.agent.name}
                </p>
                <p className='text-main-black/50 text-[14px] font-medium leading-[1.4]'>
                  Real Estate Agency
                </p>
              </div>
            </div>
            <div className='flex gap-2'>
              <RealVistaButton variant='secondary' size='small'>
                Ask a question
              </RealVistaButton>
              <RealVistaButton variant='secondary' size='small'>
                <InfoIcon className='size-4' />
                Get more info
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
        You agree to Estatery&apos;s Terms of Use & Privacy Policy. By choosing to contact a
        property, you also agree that Estatery Group, landlords, and property managers may call or
        text you about any inquiries you submit through our services, which may involve use of
        automated means and prerecorded/artificial voices. You don&apos;t need to consent as a
        condition of renting any property, or buying any other goods or services. Message/data rates
        may apply.
      </p>
    </div>
  );
}
