'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Search, ChevronDown, MoreHorizontal, Eye, ArrowUpDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type PropertyStatus = 'Available' | 'Occupied' | 'Sold Out';

interface PropertyRow {
  id: number;
  name: string;
  type: string;
  cost: string;
  activeLeads: number;
  views: number;
  status: PropertyStatus;
  occupancy?: string;
}

const properties: PropertyRow[] = [
  { id: 1, name: 'Summer House', type: 'House', cost: '$655K', activeLeads: 18, views: 267, status: 'Available' },
  { id: 2, name: 'Cheery Castle', type: 'House', cost: '$602K', activeLeads: 24, views: 891, status: 'Occupied', occupancy: '24/28' },
  { id: 3, name: 'Lazy Shore Palace', type: 'Medical', cost: '$842K', activeLeads: 9, views: 124, status: 'Available' },
  { id: 4, name: 'Green Hangout Place', type: 'Office', cost: '$748K', activeLeads: 14, views: 502, status: 'Available' },
  { id: 5, name: 'Relaxed House', type: 'Apartment', cost: '$972K', activeLeads: 31, views: 155, status: 'Occupied', occupancy: '82/86' },
  { id: 6, name: 'Maison Sterling', type: 'House', cost: '$1.5M', activeLeads: 5, views: 125, status: 'Occupied', occupancy: '8/12' },
  { id: 7, name: 'The Orchid', type: 'Villa', cost: '$520K', activeLeads: 22, views: 930, status: 'Available' },
  { id: 8, name: 'Echelon West', type: 'House', cost: '$700K', activeLeads: 12, views: 355, status: 'Available' },
  { id: 9, name: 'La Residence', type: 'Apartment', cost: '$700K', activeLeads: 19, views: 425, status: 'Sold Out' },
];

type StatusFilter = 'All' | PropertyStatus;

export function PropertyTable() {
  const t = useTranslations('OwnerDashboard.propertyTable');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('All');

  const statusConfig: Record<PropertyStatus, { label: string; class: string }> = {
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

  const filtered = properties.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className='flex flex-col gap-4 rounded-2xl border bg-card shadow-sm'>
      {/* Header */}
      <div className='flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h3 className='text-base font-semibold'>{t('title')}</h3>
          <p className='text-xs text-muted-foreground'>{t('properties', { count: filtered.length })}</p>
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
                t('columns.activeLeads'),
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
            {filtered.map((property) => {
              const statusCfg = statusConfig[property.status];
              return (
                <tr
                  key={property.id}
                  className='border-b last:border-0 hover:bg-muted/30 transition-colors'
                >
                  <td className='px-5 py-3.5'>
                    <p className='font-medium text-sm'>{property.name}</p>
                  </td>
                  <td className='px-5 py-3.5'>
                    <span className='rounded-lg bg-muted px-2 py-0.5 text-xs font-medium'>
                      {property.type}
                    </span>
                  </td>
                  <td className='px-5 py-3.5'>
                    <span className='font-semibold'>{property.cost}</span>
                  </td>
                  <td className='px-5 py-3.5'>
                    <div className='flex items-center gap-2'>
                      <div className='h-1.5 w-16 rounded-full bg-muted'>
                        <div
                          className='h-1.5 rounded-full bg-primary'
                          style={{ width: `${Math.min((property.activeLeads / 35) * 100, 100)}%` }}
                        />
                      </div>
                      <span className='text-xs text-muted-foreground'>{property.activeLeads}</span>
                    </div>
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
                      {property.occupancy
                        ? `${property.occupancy} ${statusCfg.label}`
                        : statusCfg.label}
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
