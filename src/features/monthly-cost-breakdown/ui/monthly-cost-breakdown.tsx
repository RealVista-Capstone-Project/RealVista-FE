'use client';

import { useTranslations } from 'next-intl';
import { Receipt } from 'lucide-react';
import type { CostBreakdown } from '@/shared/types';

export interface MonthlyCostBreakdownProps {
  costBreakdown?: CostBreakdown | null;
  listingType?: 'RENT' | 'SALE';
}

export function MonthlyCostBreakdown({
  costBreakdown,
  listingType = 'RENT',
}: MonthlyCostBreakdownProps) {
  const t = useTranslations('MonthlyCostBreakdown');

  if (!costBreakdown) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const allFees = [
    ...(costBreakdown.requiredFees || []),
    ...(costBreakdown.optionalFees || []),
  ];

  return (
    <div className='bg-white border border-primary/10 rounded-2xl p-4 shadow-sm'>
      {/* Header */}
      <div className='flex items-center gap-2 mb-4 pb-3 border-b border-border'>
        <Receipt className='size-5 text-primary' />
        <h3 className='text-sm font-semibold text-foreground'>
          {listingType === 'RENT' ? t('rentPrice') : t('salePrice')}
        </h3>
      </div>

      {/* Base Price */}
      <div className='flex items-baseline gap-2 flex-wrap mb-4'>
        <span className='text-2xl font-bold text-primary'>
          {formatCurrency(costBreakdown.basePrice)}
        </span>
        <span className='text-xs font-semibold text-muted-foreground/60'>VNĐ</span>
        {listingType === 'RENT' && (
          <span className='text-xs text-muted-foreground'>/ {t('perMonth')}</span>
        )}
      </div>

      {/* Service Fees */}
      {allFees.length > 0 && (
        <div className='space-y-2 mb-4'>
          <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
            {t('serviceFees')}
          </p>
          {allFees.map((fee, index) => (
            <div key={index} className='flex items-center justify-between text-sm'>
              <span className='text-foreground/70'>{fee.name}</span>
              <span className='font-medium text-foreground'>
                {formatCurrency(fee.amount)} VNĐ
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Divider + Total */}
      <div className='border-t border-border pt-3 flex items-center justify-between'>
        <span className='text-sm font-bold text-foreground'>{t('total')}</span>
        <span className='text-lg font-bold text-primary'>
          {formatCurrency(costBreakdown.totalCost)} VNĐ
        </span>
      </div>

      {/* Disclaimer */}
      {costBreakdown.disclaimer && (
        <p className='text-[10px] text-muted-foreground mt-3 italic leading-relaxed'>
          {costBreakdown.disclaimer}
        </p>
      )}
    </div>
  );
}
