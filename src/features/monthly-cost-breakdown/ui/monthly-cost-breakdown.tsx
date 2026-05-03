'use client';

import { useTranslations } from 'next-intl';
import type { CostBreakdown } from '@/shared/types';

export interface MonthlyCostBreakdownProps {
  costBreakdown?: CostBreakdown | null;
  listingType?: 'RENT' | 'SALE';
}

export function MonthlyCostBreakdown({
  costBreakdown,
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

  const serviceFeesTotal =
    (costBreakdown.requiredFeesSubtotal || 0) +
    (costBreakdown.optionalFeesSubtotal || 0);

  return (
    <div className='bg-white border border-primary/10 rounded-2xl p-4 shadow-sm'>
      {/* Header */}
      <h3 className='text-sm font-bold text-foreground'>
        {t('serviceFees')}
      </h3>

      {/* Disclaimer under header */}
      {costBreakdown.disclaimer && (
        <p className='text-[10px] text-muted-foreground mb-5 italic leading-relaxed'>
          {costBreakdown.disclaimer}
        </p>
      )}

      {/* Service Fees List */}
      {allFees.length > 0 && (
        <div className='space-y-2 mb-4'>
          {allFees.map((fee, index) => (
            <div key={index} className='flex items-center justify-between text-sm'>
              <span className='text-foreground/70'>{fee.name}</span>
              <span className='font-medium text-foreground'>
                {formatCurrency(fee.amount)} <span className='text-xs font-semibold text-muted-foreground/60'>VNĐ</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Divider + Summary */}
      <div className='border-t border-border pt-3 space-y-2'>
        {/* Total Service Fees */}
        <div className='flex items-center justify-between text-sm'>
          <span className='text-foreground/70'>{t('serviceFeesSubtotal')}</span>
          <span className='font-medium text-foreground'>
            {formatCurrency(serviceFeesTotal)} <span className='text-xs font-semibold text-muted-foreground/60'>VNĐ</span>
          </span>
        </div>

        {/* Base Price */}
        <div className='flex items-center justify-between text-sm'>
          <span className='text-foreground/70'>{t('rentOrSalePrice')}</span>
          <span className='font-medium text-foreground'>
            {formatCurrency(costBreakdown.basePrice)} <span className='text-xs font-semibold text-muted-foreground/60'>VNĐ</span>
          </span>
        </div>

        {/* Grand Total */}
        <div className='flex items-center justify-between pt-2 border-t border-border'>
          <span className='text-sm font-bold text-foreground'>{t('total')}</span>
          <span className='text-lg font-bold text-primary'>
            {formatCurrency(costBreakdown.totalCost)} <span className='text-xs font-semibold text-muted-foreground/60'>VNĐ</span>
          </span>
        </div>
      </div>

    </div>
  );
}
