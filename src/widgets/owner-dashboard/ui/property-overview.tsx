'use client';

import { Progress } from '@/shared/ui/progress';
import { Building2, Home } from 'lucide-react';

const activeListings = [
  {
    id: 1,
    name: 'Summer House',
    address: 'Jl. Mencari Cinta Sejati, Jakarta',
    avatarCount: 9,
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  },
  {
    id: 2,
    name: 'Cheery Castle',
    address: 'Jl. Pantai Kuta, Bali',
    avatarCount: 52,
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  {
    id: 3,
    name: 'Lazy Shore Palace',
    address: 'Jl. Sudirman, Jakarta',
    avatarCount: 6,
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  },
  {
    id: 4,
    name: 'Green Hangout Place',
    address: 'Jl. Gatot Subroto, Jakarta',
    avatarCount: 33,
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  },
  {
    id: 5,
    name: 'Maison Sterling',
    address: 'New York, Albany',
    avatarCount: 32,
    badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  },
  {
    id: 6,
    name: 'The Orchid',
    address: 'Ohio, Columbus',
    avatarCount: 15,
    badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
  },
];

export function PropertyOverview() {
  const total = 1323;
  const listed = 823;
  const sold = 409;
  const listedPercent = Math.round((listed / total) * 100);
  const soldPercent = Math.round((sold / total) * 100);

  return (
    <div className='flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>Property Overview</h3>
        <button className='text-xs font-medium text-primary hover:underline'>View all</button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-4 rounded-xl bg-muted/40 p-4'>
        <div className='text-center'>
          <p className='text-xl font-bold'>{total.toLocaleString()}</p>
          <p className='text-xs text-muted-foreground'>Total Property</p>
        </div>
        <div className='text-center border-x border-border'>
          <p className='text-xl font-bold text-indigo-600 dark:text-indigo-400'>{listed}</p>
          <p className='text-xs text-muted-foreground'>Listed Property</p>
          <div className='mt-1.5 px-2'>
            <Progress value={listedPercent} className='h-1.5' />
          </div>
        </div>
        <div className='text-center'>
          <p className='text-xl font-bold text-emerald-600 dark:text-emerald-400'>{sold}</p>
          <p className='text-xs text-muted-foreground'>Property Sold</p>
          <div className='mt-1.5 px-2'>
            <Progress value={soldPercent} className='h-1.5 [&>div]:bg-emerald-500' />
          </div>
        </div>
      </div>

      {/* Active Listings label */}
      <div className='flex items-center gap-2'>
        <Building2 className='h-4 w-4 text-muted-foreground' />
        <p className='text-sm font-medium'>Active Listing</p>
      </div>

      {/* Listings grid */}
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {activeListings.map((listing) => (
          <div
            key={listing.id}
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
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${listing.badgeColor}`}
            >
              +{listing.avatarCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
