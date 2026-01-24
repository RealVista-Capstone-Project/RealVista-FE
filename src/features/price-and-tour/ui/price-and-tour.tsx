'use client';

import { useState } from 'react';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { DatePickerInput } from '@/shared/ui/realvista-input-date-picker';

export interface PriceAndTourProps {
  price: number;
  onContact?: () => void;
  onRequestTour?: (date: string) => void;
}

/**
 * PriceAndTour component displays property pricing and tour request form
 *
 * Shows monthly rent price, contact button, and a home tour request form with date picker
 */
export function PriceAndTour({ price, onContact, onRequestTour }: PriceAndTourProps) {
  const [tourDate, setTourDate] = useState('');

  const handleRequestTour = () => {
    if (tourDate && onRequestTour) {
      onRequestTour(tourDate);
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <div className='bg-white border border-purple-92 rounded-lg p-6 w-full'>
      <div className='flex flex-col gap-6'>
        {/* Rent Price Section */}
        <div className='flex flex-col gap-1'>
          <p className='text-main-black/50 text-[14px] font-medium leading-[1.4]'>Rent price</p>
          <div className='flex items-baseline gap-0.5'>
            <p className='text-main-primary text-[24px] font-extrabold leading-[1.5] tracking-[-1px]'>
              {formattedPrice}
            </p>
            <span className='text-main-black/50 text-[14px] font-medium h-8 flex items-center'>
              /month
            </span>
          </div>
        </div>

        {/* Contact Button */}
        <RealVistaButton variant='primary' size='medium' className='w-full' onClick={onContact}>
          Contact Agent
        </RealVistaButton>

        {/* Divider */}
        <div className='h-px w-full bg-purple-92' />

        {/* Request a Home Tour Section */}
        <div className='flex flex-col gap-6'>
          <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
            Request a home tour
          </p>

          <div className='flex flex-col gap-6'>
            {/* Date Selector */}
            <DatePickerInput
              id='tour-date-input'
              value={tourDate}
              onChange={(value) => setTourDate(value)}
              placeholder='Select tour date'
              minDate={new Date()}
              variant='tour'
            />

            {/* Request Tour Button */}
            <RealVistaButton
              variant='primary'
              size='medium'
              className='w-full bg-main-secondary'
              disabled={!tourDate}
              onClick={handleRequestTour}
            >
              Request Tour
            </RealVistaButton>

            {/* Disclaimer */}
            <p className='text-grey-500 text-[12px] font-normal leading-[1.35]'>
              It&apos;s free, with no obligation — cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
