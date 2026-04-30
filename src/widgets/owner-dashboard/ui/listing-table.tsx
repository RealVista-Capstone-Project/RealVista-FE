'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Search, ChevronDown, MoreHorizontal, Eye, ArrowUpDown } from 'lucide-react';
import { cn, formatVND } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { mapBackendStatusToUiStatus, useDashboardProperties } from '../api';
import type { PropertyFilterStatus } from '../api';

type UiPropertyStatus = Exclude<PropertyFilterStatus, 'All'>;

type StatusFilter = PropertyFilterStatus;

export function ListingTable() {
  const t = useTranslations('OwnerDashboard.propertyTable');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('All');
  const debouncedSearch = useDebounce(search, 400);

  const { data: propertiesPage } = useDashboardProperties({
    search: debouncedSearch || undefined,
    status: filter,
    page: 0,
    size: 10,
    sortBy: 'cost',
    sortDir: 'desc',
  });

  const statusConfig: Record<UiPropertyStatus, { label: string; class: string }> = {
    Available: {
      label: t('status.available'),
      class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
    Occupied: {
      label: t('status.occupied'),
      class: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    },
    'Sold Out': {
      label: t('status.soldOut'),
      class: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    },
  };

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'All', label: t('allStatus') },
    { value: 'Available', label: t('status.available') },
    { value: 'Occupied', label: t('status.occupied') },
    { value: 'Sold Out', label: t('status.soldOut') },
  ];

  const properties = propertiesPage?.content ?? [];

  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card shadow-sm'>
      {/* Header */}
      <div className='flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h3 className='text-base font-semibold'>{t('title')}</h3>
          <p className='text-xs text-muted-foreground'>
            {t('properties', { count: propertiesPage?.totalElements ?? 0 })}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
            <input
              type='text'
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='h-8 w-44 rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-ring'
            />
          </div>
          {/* Filter */}
          <div className='relative'>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as StatusFilter)}
              className='h-8 appearance-none rounded-lg border bg-background pl-3 pr-7 text-xs outline-none focus:ring-2 focus:ring-ring cursor-pointer'
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className='absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none text-muted-foreground' />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b'>
              {[
                t('columns.property'),
                t('columns.type'),
                t('columns.cost'),
                t('columns.views'),
                t('columns.status'),
                '',
              ].map((col, i) => (
                <th
                  key={i}
                  className='px-5 py-3 text-left text-xs font-medium text-muted-foreground'
                >
                  {col ? (
                    <div className='flex items-center gap-1'>
                      {col}
                      {[t('columns.cost'), t('columns.activeLeads'), t('columns.views')].includes(col) && (
                        <ArrowUpDown className='h-3 w-3 opacity-50' />
                      )}
                    </div>
                  ) : (
                    ''
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => {
              const uiStatus = mapBackendStatusToUiStatus(property.status);
              const statusCfg = statusConfig[uiStatus];

              return (
                <tr
                  key={property.listingId}
                  className='border-b last:border-0 hover:bg-muted/30 transition-colors'
                >
                  <td className='px-5 py-3.5 max-w-[200px]'>
                    <p className='font-medium text-sm line-clamp-2' title={property.name}>
                      {property.name}
                    </p>
                  </td>
                  <td className='px-5 py-3.5'>
                    <span className='rounded-lg bg-muted px-2 py-0.5 text-xs font-medium'>
                      {property.type}
                    </span>
                  </td>
                  <td className='px-5 py-3.5'>
                    <span className='font-semibold'>{formatVND(property.cost)}</span>
                  </td>
                  <td className='px-5 py-3.5'>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <Eye className='h-3.5 w-3.5' />
                      {property.views.toLocaleString()}
                    </div>
                  </td>
                  <td className='px-5 py-3.5'>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusCfg.class,
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className='px-5 py-3.5'>
                    <button className='flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors'>
                      <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
