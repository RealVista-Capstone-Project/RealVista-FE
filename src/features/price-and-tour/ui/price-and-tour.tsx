'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, Phone } from 'lucide-react';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { DatePickerInput } from '@/shared/ui/realvista-input-date-picker';
import { formatVND } from '@/shared/lib/utils';

export interface PriceAndTourProps {
  price: number;
  listingType: 'RENT' | 'SALE';
  phone?: string | null;
  onContact?: () => void;
  onRequestTour?: (date: string) => void;
  isAgent?: boolean;
}

/**
 * PriceAndTour component displays property pricing and tour request form
 *
 * Shows monthly rent price, contact button, and a home tour request form with date picker
 */
export function PriceAndTour({
  price,
  listingType,
  phone,
  onContact,
  onRequestTour,
  isAgent,
}: PriceAndTourProps) {
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

  const contactLabel = isAgent ? 'môi giới' : 'chủ nhà';

  return (
    <div className='bg-white border border-primary/20 rounded-lg p-6 w-full'>
      <div className='flex flex-col gap-6'>
        {/* Price Section */}
        <div className='flex flex-col gap-1'>
          <p className='text-foreground/50 text-[14px] font-medium leading-[1.4]'>{priceLabel}</p>
          <div className='flex items-baseline gap-0.5'>
            <p className='text-primary text-[24px] font-extrabold leading-[1.5] tracking-[-1px]'>
              {formatVND(price)}
            </p>
            <span className='text-sm font-semibold text-muted-foreground'>VNĐ</span>
            {priceSuffix && (
              <span className='text-foreground/50 text-[14px] font-medium h-8 flex items-center'>
                {priceSuffix}
              </span>
            )}
          </div>
        </div>

        {/* Contact Button */}
        <div className='flex flex-col gap-2 w-full'>
          {phone && (
            <RealVistaButton
              variant='primary'
              size='medium'
              className='w-full'
              onClick={handleCall}
              title={`${t('callAgent')}: ${phone}`}
            >
              <Phone className='h-4 w-4' strokeWidth={2.5} />
              <span>Liên hệ {contactLabel}</span>
            </RealVistaButton>
          )}

          <RealVistaButton
            variant='secondary'
            size='medium'
            className={`${phone ? '' : 'w-full'} border-primary text-primary hover:bg-primary/5`}
            onClick={onContact}
          >
            <MessageCircle className='h-4 w-4' strokeWidth={2.5} />
            <span>Nhắn tin với {contactLabel}</span>
          </RealVistaButton>
        </div>

        {/* Divider */}
        <div className='h-px w-full bg-primary/15' />

        {/* Request a Home Tour Section */}
        <div className='flex flex-col gap-6'>
          <p className='text-foreground text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
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
              className='w-full bg-secondary'
              disabled={!tourDate}
              onClick={handleRequestTour}
            >
              {t('requestTour')}
            </RealVistaButton>

            {/* Disclaimer */}
            <p className='text-muted-foreground text-[12px] font-normal leading-[1.35]'>
              {t('disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
