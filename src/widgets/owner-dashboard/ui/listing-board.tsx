'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronDown, Eye, MoreHorizontal, Users } from 'lucide-react';
import { formatVND } from '@/shared/lib/utils/format-currency';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { useDashboardProperties } from '../api';
import type { DashboardPropertyItemDTO } from '../api/dashboard.api.types';

type SortOption = 'views' | 'leads' | 'cost';

export function ListingBoard({ capHeightToParent = false }: { capHeightToParent?: boolean }) {
  const t = useTranslations('OwnerDashboard.listingBoard');
  const [sortBy, setSortBy] = React.useState<SortOption>('views');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: page, isLoading } = useDashboardProperties({
    page: 0,
    size: 12,
    sortBy,
    sortDir: 'desc',
    status: 'All',
  });

  const items = page?.content ?? [];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'views', label: t('sortViews') },
    { value: 'leads', label: t('sortLeads') },
    { value: 'cost', label: t('sortCost') },
  ];

  const currentLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? '';

  return (
    <div
      className={cn(
        'flex min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden rounded-[24px] border border-sky-200/60 bg-card p-5 shadow-[0_2px_24px_rgba(15,23,42,0.06)] dark:border-border dark:shadow-none lg:rounded-r-none lg:border-r-0',
        capHeightToParent && 'lg:h-full lg:max-h-full',
      )}
    >
      <div className='flex shrink-0 items-center justify-between'>
        <h3 className='text-base font-semibold'>{t('title')}</h3>
        <div className='relative' ref={dropdownRef}>
          <button
            type='button'
            onClick={() => setIsDropdownOpen((v) => !v)}
            className='flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            {currentLabel}
            <ChevronDown className={cn('h-3 w-3 transition-transform', isDropdownOpen && 'rotate-180')} />
          </button>
          {isDropdownOpen && (
            <div className='absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border bg-background shadow-lg p-1'>
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => { setSortBy(opt.value); setIsDropdownOpen(false); }}
                  className={cn(
                    'flex w-full items-center whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-primary/5',
                    sortBy === opt.value ? 'text-primary' : 'text-foreground hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-4 overflow-x-hidden pr-1',
          capHeightToParent && 'lg:min-h-0 lg:flex-1 lg:overflow-y-auto',
        )}
      >
        {isLoading ? (
          <div className='flex flex-col gap-4'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-48 w-full rounded-2xl' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>{t('empty')}</p>
        ) : (
          <div className='flex flex-col gap-4'>
            {items.map((item) => (
              <ListingCard key={item.listing_id} item={item} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({
  item,
  t,
}: {
  item: DashboardPropertyItemDTO;
  t: ReturnType<typeof useTranslations>;
}) {
  const img = item.image_url?.trim();
  const isRent = item.listing_type === 'RENT';
  const subtitle = item.name.includes(' - ') ? item.name.split(' - ').slice(1).join(' - ') : item.name;

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-black/[0.05] bg-white/90 p-3 shadow-sm dark:border-border dark:bg-card/80'>
      <div className='relative h-[136px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#f0faf5] to-[#eef6fb] dark:from-emerald-500/10 dark:to-sky-500/10'>
        {img ? (
          <Image src={img} alt={item.name} fill sizes='320px' className='object-cover' />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <span className='text-xs text-muted-foreground'>{t('noImage')}</span>
          </div>
        )}
        <button
          type='button'
          className='absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground'
          aria-label={t('moreOptions')}
        >
          <MoreHorizontal className='h-3.5 w-3.5' />
        </button>
      </div>

      <div className='flex items-baseline gap-1'>
        <span className='text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400'>
          {formatVND(item.cost)}
        </span>
        {isRent && (
          <span className='text-xs font-medium text-muted-foreground'>{t('perMonth')}</span>
        )}
      </div>

      <div className='flex flex-col gap-0.5'>
        <p className='text-sm font-semibold leading-snug'>{item.type}</p>
        <p className='text-xs text-muted-foreground line-clamp-2'>{subtitle}</p>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <span className='inline-flex items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm dark:border-primary/45 dark:bg-primary/15'>
          <Eye className='h-3.5 w-3.5 shrink-0 text-primary' />
          <span className='text-muted-foreground'>
            {item.views.toLocaleString()} <span className='font-semibold text-foreground'>{t('viewsLabel')}</span>
          </span>
        </span>
        <span className='inline-flex items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm dark:border-primary/45 dark:bg-primary/15'>
          <Users className='h-3.5 w-3.5 shrink-0 text-primary' />
          <span className='text-muted-foreground'>
            {item.active_leads.toLocaleString()}{' '}
            <span className='font-semibold text-foreground'>{t('leadsLabel')}</span>
          </span>
        </span>
      </div>
    </div>
  );
}
