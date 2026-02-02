'use client';

import { useTranslations } from 'next-intl';

export interface CostItem {
  labelKey: string;
  amount: number;
  description?: string;
}

export interface MonthlyCostBreakdownProps {
  items: CostItem[];
  total: number;
  currency?: string;
  locale?: string;
}

/**
 * MonthlyCostBreakdown component displays a breakdown of monthly costs
 *
 * Shows individual cost items with labels and amounts, plus a highlighted total
 */
export function MonthlyCostBreakdown({
  items,
  total,
  currency = 'USD',
  locale = 'en-US',
}: MonthlyCostBreakdownProps) {
  const t = useTranslations('MonthlyCostBreakdown');
  const common = useTranslations('Common');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLabel = (labelKey: string) => {
    return t(labelKey);
  };

  return (
    <div className='bg-white border border-purple-92 rounded-lg p-6 w-full'>
      <div className='flex flex-col gap-6'>
        {/* Title */}
        <div className='flex flex-col gap-1'>
          <p className='text-main-black text-[20px] sm:text-[24px] font-bold leading-[1.6]'>
            {t('title')}
          </p>
        </div>

        {/* Cost Items */}
        <div className='flex flex-col gap-4'>
          {items.map((item, index) => (
            <div key={index} className='flex flex-col gap-1'>
              <div className='flex items-center justify-between'>
                <p className='text-main-black text-[16px] font-medium leading-[1.5]'>
                  {getLabel(item.labelKey)}
                </p>
                <p className='text-main-black text-[18px] font-bold leading-[1.45] tracking-[-0.09px]'>
                  {formatCurrency(item.amount)}
                </p>
              </div>
              {item.description && (
                <p className='text-main-black/50 text-[14px] font-medium leading-[1.4]'>
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className='h-px w-full bg-purple-92' />

        {/* Total */}
        <div className='flex items-center justify-between'>
          <p className='text-main-black text-[16px] font-medium leading-[1.5]'>
            {t('totalMonthlyPayment')}
          </p>
          <div className='flex items-baseline gap-0.5'>
            <p className='text-main-primary text-[24px] font-extrabold leading-[1.5] tracking-[-1px]'>
              {formatCurrency(total)}
            </p>
            <span className='text-main-black/50 text-[14px] font-medium h-8 flex items-center'>
              {common('perMonth')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
