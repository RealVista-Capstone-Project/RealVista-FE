'use client';

import { useTranslations } from 'next-intl';
import { Progress } from '@/shared/ui/progress';
import { Building2, Home } from 'lucide-react';
import { usePropertyOverview } from '../api';

const badgeColors = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
];

export function PropertyOverview() {
  const t = useTranslations('OwnerDashboard.propertyOverview');
  const { data } = usePropertyOverview();

  const total = data?.total ?? 0;
  const listed = data?.listed ?? 0;
  const sold = data?.sold ?? 0;
  const listedPercent = data?.listedPercent ?? 0;
  const soldPercent = data?.soldPercent ?? 0;

  return (
    <div className='flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>{t('title')}</h3>
        <button className='text-xs font-medium text-primary hover:underline'>{t('viewAll')}</button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-4 rounded-xl bg-muted/40 p-4'>
        <div className='text-center'>
          <p className='text-xl font-bold'>{total.toLocaleString()}</p>
          <p className='text-xs text-muted-foreground'>{t('totalProperty')}</p>
        </div>
        <div className='text-center border-x border-border'>
          <p className='text-xl font-bold text-indigo-600 dark:text-indigo-400'>{listed}</p>
          <p className='text-xs text-muted-foreground'>{t('listedProperty')}</p>
          <div className='mt-1.5 px-2'>
            <Progress value={listedPercent} className='h-1.5' />
          </div>
        </div>
        <div className='text-center'>
          <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>{sold}</p>
          <p className='text-xs text-muted-foreground'>{t('propertySold')}</p>
          <div className='mt-1.5 px-2'>
            <Progress value={soldPercent} className='h-1.5 [&>div]:bg-emerald-500' />
          </div>
        </div>
      </div>

      {/* Active Listings label */}
      <div className='flex items-center gap-2'>
        <Building2 className='h-4 w-4 text-muted-foreground' />
        <p className='text-sm font-medium'>{t('activeListing')}</p>
      </div>

      {/* Listings grid */}
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {(data?.activeListings ?? []).map((listing, index) => (
          <div
            key={listing.listingId}
            className='flex items-center gap-3 rounded-xl border bg-muted/20 p-3 hover:bg-muted/40 transition-colors cursor-pointer'
          >
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted'>
              <Home className='h-4 w-4 text-muted-foreground' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold truncate'>{listing.name}</p>
              <p className='text-xs text-muted-foreground truncate'>{listing.address}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeColors[index % badgeColors.length]}`}
            >
              +{listing.leadCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
