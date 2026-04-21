'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { RentalContract } from '@/entities/rental-contract';
import {
  formatContractCurrency,
  formatContractDate,
  getContractInitials,
  getRentalContractStatusColor,
} from '../lib/utils';

interface ContractListItemProps {
  contract: RentalContract;
  isSelected: boolean;
  onClick: (contract: RentalContract) => void;
}

export function ContractListItem({ contract, isSelected, onClick }: ContractListItemProps) {
  const locale = useLocale();
  const t = useTranslations('RentalContract');

  const statusKey = `status.${contract.status.toLowerCase()}` as const;
  const statusLabel = t.has(statusKey) ? t(statusKey) : contract.status;

  return (
    <div
      className={cn(
        'grid cursor-pointer grid-cols-12 items-center gap-4 border-l-[3px] px-5 py-4 transition-all duration-150 group',
        isSelected
          ? 'border-l-primary bg-primary/5'
          : 'border-l-transparent bg-white hover:border-l-primary/20 hover:bg-primary/5'
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
        <Avatar
          className={cn(
            'h-10 w-10 ring-2 ring-offset-1 transition-all duration-150',
            isSelected ? 'ring-primary/30' : 'ring-gray-100'
          )}
        >
          <AvatarImage src={contract.tenant.avatarUrl ?? undefined} alt={contract.tenant.fullName} />
          <AvatarFallback className='bg-primary/10 text-primary/90 text-xs font-bold'>
            {getContractInitials(contract.tenant.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className='min-w-0'>
          <div className='truncate text-sm font-semibold text-foreground'>
            {contract.tenant.fullName}
          </div>
          <div className='mt-0.5 truncate text-xs text-muted-foreground'>
            {contract.tenant.email}
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
            {formatContractDate(contract.createdAt, locale, 'dd MMM')}
          </div>
          <div className='mt-0.5 text-xs text-muted-foreground tabular-nums'>
            {formatContractDate(contract.createdAt, locale, 'yyyy')}
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
