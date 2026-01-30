'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('PriceAndTour');
  const [tourDate, setTourDate] = useState('');

  const handleRequestTour = () => {
    if (tourDate && onRequestTour) {
      onRequestTour(tourDate);
    }
  };

  // Convert price to millions (tr) for Vietnamese format
  const priceInMillions = price / 1000000;
  const formattedPrice = `${priceInMillions.toFixed(1).replace('.', ',')}`;

  return (
    <div className='bg-white border border-purple-92 rounded-lg p-6 w-full'>
      <div className='flex flex-col gap-6'>
        {/* Rent Price Section */}
        <div className='flex flex-col gap-1'>
          <p className='text-main-black/50 text-[14px] font-medium leading-[1.4]'>{t('rentPrice')}</p>
          <div className='flex items-baseline gap-0.5'>
            <p className='text-main-primary text-[24px] font-extrabold leading-[1.5] tracking-[-1px]'>
              {formattedPrice}
            </p>
            <span className='text-main-black/50 text-[14px] font-medium h-8 flex items-center'>
              {t('perMonth')}
            </span>
          </div>
        </div>

        {/* Contact Button */}
        <RealVistaButton variant='primary' size='medium' className='w-full' onClick={onContact}>
          {t('contactAgent')}
        </RealVistaButton>

        {/* Divider */}
        <div className='h-px w-full bg-purple-92' />

        {/* Request a Home Tour Section */}
        <div className='flex flex-col gap-6'>
          <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
            {t('requestHomeTour')}
          </p>

          <div className='flex flex-col gap-6'>
            {/* Date Selector */}
            <DatePickerInput
              id='tour-date-input'
              value={tourDate}
              onChange={(value) => setTourDate(value)}
              placeholder={t('selectTourDate')}
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
              {t('requestTour')}
            </RealVistaButton>

            {/* Disclaimer */}
            <p className='text-grey-500 text-[12px] font-normal leading-[1.35]'>
              {t('disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
