'use client';

import * as React from 'react';
import {
  MyRentalContractsProvider,
  useMyRentalContractsContext,
} from '../model/my-rental-contracts-context';
import { TenantContractListItem } from './tenant-contract-list-item';
import { TenantContractDetailPanel } from './tenant-contract-detail-panel';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';
import { cn } from '@/shared/lib/utils';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/shared/ui/data-table';
import { useTenantContractColumns } from '@/features/rental-contract/ui/contract-columns';

function MyRentalContractsContent() {
  const {
    contracts,
    currentPage,
    handleContractClick,
    isError,
    isLoading,
    inputValue,
    itemsPerPage,
    searchQuery,
    selectedContract,
    setCurrentPage,
    setSearchQuery,
    setSelectedContract,
    setStatusFilter,
    statusFilter,
    totalElements,
    totalPages,
  } = useMyRentalContractsContext();

  const t = useTranslations('MyRentalContracts');

  const [isSearchPending, setIsSearchPending] = React.useState(false);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsSearchPending(inputValue !== searchQuery);
  }, [inputValue, searchQuery]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const hasActiveStatus = statusFilter !== 'all';
  const activeFilterCount = hasActiveStatus ? 1 : 0;

  const resetFilters = () => {
    setStatusFilter('all');
    setIsFilterOpen(false);
  };

  const filterStatusOptions = [
    { value: 'all', labelKey: 'filter.allStatuses' },
    { value: 'PENDING_RENTER', labelKey: 'filter.pendingRenter' },
    { value: 'ACTIVE', labelKey: 'filter.active' },
    { value: 'EXPIRED', labelKey: 'filter.expired' },
    { value: 'TERMINATED', labelKey: 'filter.terminated' },
  ];

  const columns = useTenantContractColumns();

  const pagination: PaginationState = {
    pageIndex: currentPage - 1,
    pageSize: itemsPerPage,
  };

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center p-4 sm:p-6'>
        <Spinner className='size-8 text-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-full items-center justify-center p-4 sm:p-6'>
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <FileSearch className='h-6 w-6 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('error')}</p>
        </div>
      </div>
    );
  }

  const toolbar = (
    <div className='flex flex-col gap-4 p-4 sm:p-5'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h2 className='text-xl font-bold text-foreground'>{t('hero.title')}</h2>
          <div className='flex items-center justify-center rounded-full bg-primary px-2 py-0.5'>
            <span className='text-sm font-bold text-white'>{totalElements}</span>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <div className='relative flex-1 max-w-md'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
            <Search className='h-5 w-5 text-muted-foreground/70' strokeWidth={2} />
          </div>
          <Input
            value={inputValue}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('filter.searchPlaceholder')}
            className='h-11 w-full rounded-lg border-2 border-primary/20 bg-primary/5 pl-12 pr-10 text-base font-medium focus:border-primary focus:outline-none focus:ring-0'
            aria-label={t('filter.searchAria')}
          />
          {isSearchPending && (
            <span className='pointer-events-none absolute inset-y-0 right-4 flex items-center'>
              <Spinner className='size-4 text-primary' />
            </span>
          )}
        </div>

        <div ref={filterRef} className='relative shrink-0'>
          <button
            type='button'
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={cn(
              'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              hasActiveStatus
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-primary/20 bg-white text-foreground hover:bg-primary/5'
            )}
          >
            <Filter className='h-5 w-5' strokeWidth={2} />
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isFilterOpen && 'rotate-180')}
              strokeWidth={2}
            />
            {hasActiveStatus && (
              <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
                {activeFilterCount}
              </span>
            )}
          </button>

          {isFilterOpen && (
            <div className='absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-primary/20 bg-white shadow-lg'>
              <div className='flex items-center justify-between border-b border-primary/20 px-4 py-3'>
                <span className='text-sm font-semibold text-foreground'>
                  {t('filter.filterTitle')}
                </span>
                <button
                  type='button'
                  onClick={resetFilters}
                  className='cursor-pointer text-xs font-medium text-primary hover:underline'
                >
                  {t('filter.reset')}
                </button>
              </div>
              <div className='p-3'>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  {t('filter.statusLabel')}
                </p>
                <div className='flex flex-col gap-1'>
                  {filterStatusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type='button'
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                        statusFilter === opt.value
                          ? 'bg-primary/5 font-medium text-primary'
                          : 'text-foreground hover:bg-primary/5'
                      )}
                    >
                      {t(opt.labelKey as Parameters<typeof t>[0])}
                      {statusFilter === opt.value && (
                        <X className='h-3.5 w-3.5' strokeWidth={2.5} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className='p-4 sm:p-6 flex gap-4 items-start'>
      <div className='flex-1 min-w-0'>
        <DataTable
          columns={columns}
          data={contracts}
          isLoading={isLoading}
          pageCount={totalPages}
          pagination={pagination}
          onPaginationChange={(updater) => {
            const next = typeof updater === 'function' ? updater(pagination) : updater;
            setCurrentPage(next.pageIndex + 1);
          }}
          toolbar={toolbar}
          emptyIcon={<FileSearch className='h-10 w-10 text-primary/40 mb-2' />}
          emptyTitle={t('empty.title')}
          pageInfoText={(current) => {
            const from = (current - 1) * itemsPerPage + 1;
            const to = Math.min(current * itemsPerPage, totalElements);
            return t('pagination.showing', { from, to, total: totalElements });
          }}
        />
      </div>
    </div>
  );
}

export function MyRentalContractsPage() {
  return (
    <MyRentalContractsProvider>
      <MyRentalContractsContent />
    </MyRentalContractsProvider>
  );
}
