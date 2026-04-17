'use client';

import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { ChevronRight, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { RentalContract } from '@/entities/rental-contract';
import {
  formatContractCurrency,
  formatContractDate,
  getRentalContractStatusColor,
} from '@/features/rental-contract/lib/utils';

interface TenantContractListItemProps {
  contract: RentalContract;
  isSelected: boolean;
  onClick: (contract: RentalContract) => void;
}

export function TenantContractListItem({ contract, isSelected, onClick }: TenantContractListItemProps) {
  const locale = useLocale();
  const t = useTranslations('RentalContract');

  const statusKey = `status.${contract.status.toLowerCase()}` as const;
  const statusLabel = t.has(statusKey) ? t(statusKey) : contract.status;

  return (
    <div
      className={cn(
        'grid cursor-pointer grid-cols-12 items-center gap-4 border-l-[3px] px-5 py-4 transition-all duration-150 group',
        isSelected
          ? 'border-l-primary bg-[#F2F0FF]'
          : 'border-l-transparent bg-white hover:border-l-[#D7D1F8] hover:bg-[#FBFAFF]'
      )}
      onClick={() => onClick(contract)}
    >
      <div className='col-span-2'>
        <Badge
          variant='secondary'
          className={cn(
            'h-6 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
            getRentalContractStatusColor(contract.status)
          )}
        >
          {statusLabel}
        </Badge>
      </div>

      <div className='col-span-5 flex items-center gap-3'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF]'>
          <MapPin className='h-5 w-5 text-primary' />
        </div>

        <div className='min-w-0'>
          <div className='truncate text-sm font-semibold text-foreground'>
            {contract.property.title}
          </div>
          <div className='mt-0.5 truncate text-xs text-muted-foreground'>
            {contract.property.address}
          </div>
        </div>
      </div>

      <div className='col-span-3'>
        <div className='text-sm font-semibold text-foreground'>
          {formatContractCurrency(contract.monthlyRent, locale === 'vi' ? 'vi-VN' : 'en-US')}
        </div>
        <div className='mt-0.5 text-xs text-muted-foreground'>{t('table.perMonth')}</div>
      </div>

      <div className='col-span-2 flex items-center justify-between gap-2'>
        <div>
          <div className='text-sm font-semibold text-foreground tabular-nums'>
            {formatContractDate(contract.leaseStartDate, locale, 'dd MMM')}
          </div>
          <div className='mt-0.5 text-xs text-muted-foreground tabular-nums'>
            {formatContractDate(contract.leaseStartDate, locale, 'yyyy')}
          </div>
        </div>

        <ChevronRight
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-all duration-150',
            isSelected ? 'text-primary' : 'text-gray-200 group-hover:text-gray-400'
          )}
        />
      </div>
    </div>
  );
}
