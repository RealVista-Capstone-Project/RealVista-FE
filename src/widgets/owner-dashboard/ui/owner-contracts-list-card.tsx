'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, FileText } from 'lucide-react';
import {
  rentalContractQueries,
  RentalContractStatus,
  type RentalContract,
} from '@/entities/rental-contract';
import { useAuthSession } from '@/features/auth/model';
import { Link } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import { formatVND } from '@/shared/lib/utils/format-currency';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

function formatShortDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: RentalContractStatus) {
  switch (status) {
    case RentalContractStatus.ACTIVE:
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    case RentalContractStatus.PENDING_LANDLORD:
    case RentalContractStatus.PENDING_RENTER:
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-400';
    case RentalContractStatus.DRAFT:
      return 'bg-slate-500/15 text-slate-700 dark:text-slate-400';
    case RentalContractStatus.EXPIRED:
    case RentalContractStatus.TERMINATED:
    case RentalContractStatus.REJECTED:
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function OwnerContractsListCard() {
  const t = useTranslations('OwnerDashboard.contracts');
  const tStatus = useTranslations('RentalContract.status');
  const locale = useLocale();
  const { data: session } = useAuthSession();
  const landlordId = session?.user?.id ?? '';

  const { data, isLoading } = useQuery({
    ...rentalContractQueries.list({ landlordId, page: 0, size: 20 }),
    enabled: Boolean(landlordId),
  });

  const pageData = data?.payload?.data;
  const contracts = pageData?.content ?? [];

  const statusLabel = (c: RentalContract) => {
    const sk = c.status.toLowerCase() as
      | 'draft'
      | 'pending_renter'
      | 'pending_landlord'
      | 'active'
      | 'expired'
      | 'terminated'
      | 'rejected';
    return tStatus.has(sk) ? tStatus(sk) : c.status;
  };

  return (
    <div className='flex min-h-[320px] flex-1 flex-col gap-4 rounded-[24px] border border-sky-200/60 bg-card p-6 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-border dark:shadow-none'>
      <div className='flex shrink-0 items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
            <FileText className='h-4 w-4 text-primary' />
          </div>
          <h3 className='text-base font-semibold'>{t('title')}</h3>
        </div>
        <Link
          href={ROUTES.dashboard.rentalContracts}
          className='flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground'
        >
          {t('viewAll')}
          <ArrowRight className='h-3 w-3' />
        </Link>
      </div>

      <div className='flex flex-col gap-4 overflow-x-hidden pr-1'>
        {isLoading ? (
          <div className='flex min-h-[220px] flex-col gap-3'>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className='h-[72px] w-full rounded-xl' />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className='flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-8'>
            <p className='text-center text-sm text-muted-foreground'>{t('empty')}</p>
          </div>
        ) : (
          <ul className='flex flex-col gap-2'>
            {contracts.map((c) => (
              <li
                key={c.id}
                className='rounded-xl border border-black/[0.06] bg-muted/15 px-4 py-3 dark:border-border'
              >
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold leading-snug'>
                      {c.property.title}
                    </p>
                    <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                      {c.tenant.fullName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      statusBadgeClass(c.status),
                    )}
                  >
                    {statusLabel(c)}
                  </span>
                </div>
                <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground'>
                  <span className='font-medium text-foreground'>{formatVND(c.monthlyRent)}</span>
                  <span>
                    {formatShortDate(c.leaseStartDate, locale)} →{' '}
                    {formatShortDate(c.leaseEndDate, locale)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
