'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Phone } from 'lucide-react';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { DatePickerInput } from '@/shared/ui/realvista-input-date-picker';
import { formatVND } from '@/shared/lib/utils';

export interface PriceAndTourProps {
  price: number;
  listingType: 'RENT' | 'SALE';
  phone?: string | null;
  onContact?: () => void;
  onRequestTour?: (date: string) => void;
}

/**
 * PriceAndTour component displays property pricing and tour request form
 *
 * Shows monthly rent price, contact button, and a home tour request form with date picker
 */
export function PriceAndTour({ price, listingType, phone, onContact, onRequestTour }: PriceAndTourProps) {
  const t = useTranslations('PriceAndTour');
  const [tourDate, setTourDate] = useState('');

  const priceLabel = listingType === 'RENT' ? t('rentPrice') : t('buyPrice');
  const priceSuffix = listingType === 'RENT' ? t('perMonth') : '';

  const handleRequestTour = () => {
    if (tourDate && onRequestTour) {
      onRequestTour(tourDate);
    }
  };

  const handleCall = () => {
    if (phone) {
      window.open(`tel:${phone.replace(/\s+/g, '')}`, '_self');
    }
  };

  return (
    <div className='bg-white border border-purple-92 rounded-lg p-6 w-full'>
      <div className='flex flex-col gap-6'>
        {/* Price Section */}
        <div className='flex flex-col gap-1'>
          <p className='text-main-black/50 text-[14px] font-medium leading-[1.4]'>{priceLabel}</p>
          <div className='flex items-baseline gap-0.5'>
            <p className='text-main-primary text-[24px] font-extrabold leading-[1.5] tracking-[-1px]'>
              {formatVND(price)}
            </p>
            {priceSuffix && (
              <span className='text-main-black/50 text-[14px] font-medium h-8 flex items-center'>
                {priceSuffix}
              </span>
            )}
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

            {/* Request Tour Button & Call Button */}
            <div className='flex gap-2 w-full'>
              <RealVistaButton
                variant='primary'
                size='medium'
                className='flex-1 bg-main-secondary'
                disabled={!tourDate}
                onClick={handleRequestTour}
              >
                {t('requestTour')}
              </RealVistaButton>

              {phone && (
                <RealVistaButton
                  variant='secondary'
                  size='medium'
                  className='flex-1 border-main-primary text-main-primary hover:bg-main-primary/5 px-2'
                  onClick={handleCall}
                  title={`${t('callAgent')}: ${phone}`}
                >
                  <Phone className='h-5 w-5' strokeWidth={2.5} />
                  <span className='text-[14px] truncate'>{phone}</span>
                </RealVistaButton>
              )}
            </div>

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
