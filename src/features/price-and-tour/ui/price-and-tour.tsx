'use client';

import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { RealVistaButton } from '@/shared/ui/real-vista-button';

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
            <div
              className='bg-white border border-purple-92 rounded-lg px-4 py-3.5 cursor-pointer hover:border-purple-92-hover transition-colors'
              onClick={() => document.getElementById('tour-date-input')?.click()}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 opacity-50'>
                  <Calendar className='size-6' />
                  <p className='text-main-black text-[14px] font-medium leading-[1.4]'>
                    {tourDate || 'Select tour date'}
                  </p>
                </div>
                <div className='relative'>
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 20 20'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <circle cx='10' cy='10' r='10' fill='#7065F0' fillOpacity='0.1' />
                    <path
                      d='M10 6V14M6 10H14'
                      stroke='#7065F0'
                      strokeWidth='2'
                      strokeLinecap='round'
                    />
                  </svg>
                </div>
              </div>
              <input
                id='tour-date-input'
                type='date'
                className='sr-only'
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Request Tour Button */}
            <RealVistaButton
              variant='primary'
              size='medium'
              className='w-full'
              disabled={!tourDate}
              onClick={handleRequestTour}
            >
              Request Tour
            </RealVistaButton>

            {/* Disclaimer */}
            <p className='text-grey-500 text-[12px] font-normal leading-[1.35]'>
              It's free, with no obligation — cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
