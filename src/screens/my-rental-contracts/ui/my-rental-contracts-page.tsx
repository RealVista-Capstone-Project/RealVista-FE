'use client';

import * as React from 'react';
import {
  MyRentalContractsProvider,
  useMyRentalContractsContext,
} from '../model/my-rental-contracts-context';
import { Spinner } from '@/shared/ui/spinner';
import { cn } from '@/shared/lib/utils';
import {
  ChevronDown,
  FileSearch,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/shared/ui/data-table';
import { useTenantContractColumns } from '@/features/rental-contract/ui/contract-columns';
import { useSyncDashboardTopNavCountBadge } from '@/shared/lib/dashboard-top-nav-badge-context';

export interface MyRentalContractsPageProps {
  /** Dashboard shell already shows page title — hide inner heading and use owner-style layout. */
  embeddedInDashboard?: boolean;
}

function MyRentalContractsContent({ embeddedInDashboard }: { embeddedInDashboard: boolean }) {
  const {
    contracts,
    currentPage,
    isError,
    isLoading,
    inputValue,
    itemsPerPage,
    searchQuery,
    setCurrentPage,
    setSearchQuery,
    setStatusFilter,
    statusFilter,
    totalElements,
    totalPages,
  } = useMyRentalContractsContext();

  const t = useTranslations('MyRentalContracts');

  useSyncDashboardTopNavCountBadge(
    embeddedInDashboard && !isError && !isLoading ? totalElements : null
  );

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
      <div
        className={cn(
          'flex items-center justify-center',
          embeddedInDashboard ? 'm-4 min-h-[calc(100vh-6rem)]' : 'h-full p-4 sm:p-6'
        )}
      >
        <Spinner className='size-8 text-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          embeddedInDashboard ? 'm-4 min-h-[calc(100vh-6rem)]' : 'h-full p-4 sm:p-6'
        )}
      >
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <FileSearch className='h-6 w-6 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('error')}</p>
        </div>
      </div>
    );
  }

  const filtersRow = (
    <>
      <div className='relative min-w-0 flex-1 max-w-md'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
          <Search className='h-4 w-4 text-primary/55' strokeWidth={2.5} />
        </div>
        <input
          type='text'
          value={inputValue}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('filter.searchPlaceholder')}
          aria-label={t('filter.searchAria')}
          className='h-9 w-full rounded-lg border-2 border-primary/14 bg-[#e8f2fb] pl-10 pr-9 text-sm font-medium text-foreground placeholder:text-muted-foreground/65 shadow-sm shadow-primary/[0.04] transition-colors focus:border-primary/28 focus:bg-[#dfeef9] focus:outline-none focus:ring-0 dark:bg-input/30'
        />
        {isSearchPending && (
          <span className='pointer-events-none absolute inset-y-0 right-3.5 flex items-center'>
            <Spinner className='size-4 text-primary' />
          </span>
        )}
      </div>

      <div ref={filterRef} className='relative shrink-0'>
        <button
          type='button'
          onClick={() => setIsFilterOpen((prev) => !prev)}
          className={cn(
            'flex h-9 min-w-[2.75rem] cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 px-2.5 text-xs font-medium shadow-sm shadow-primary/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-1',
            hasActiveStatus
              ? 'border-primary/24 bg-primary/5 text-primary'
              : 'border-primary/14 bg-white text-foreground hover:border-primary/20 hover:bg-muted/30 dark:bg-background dark:hover:bg-muted/30'
          )}
        >
          <Filter className='h-4 w-4 shrink-0 text-primary' strokeWidth={2} />
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-primary transition-transform',
              isFilterOpen && 'rotate-180'
            )}
            strokeWidth={2}
          />
          {hasActiveStatus && (
            <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
              {activeFilterCount}
            </span>
          )}
        </button>

        {isFilterOpen && (
          <div className='absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-primary/20 bg-white shadow-lg dark:bg-card'>
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
    </>
  );

  const toolbar = embeddedInDashboard ? (
    <div className='flex items-center gap-3 p-4 sm:p-5'>{filtersRow}</div>
  ) : (
    <div className='flex flex-col gap-4 p-4 sm:p-5'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h2 className='text-xl font-bold text-foreground'>{t('hero.title')}</h2>
          <div className='flex items-center justify-center rounded-full bg-primary px-2 py-0.5'>
            <span className='text-sm font-bold text-white'>{totalElements}</span>
          </div>
        </div>
      </div>
      <div className='flex items-center gap-3'>{filtersRow}</div>
    </div>
  );

  return (
    <div
      className={cn(
        embeddedInDashboard ? 'm-4' : 'flex items-start gap-4 p-4 sm:p-6'
      )}
    >
      <div className={cn('min-w-0', embeddedInDashboard ? 'w-full' : 'flex-1')}>
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
          emptyIcon={<FileSearch className='mb-2 h-10 w-10 text-primary/40' />}
          emptyTitle={t('empty.title')}
          pageInfoText={(current) => {
            const from = (current - 1) * itemsPerPage + 1;
            const to = Math.min(current * itemsPerPage, totalElements);
            return t('pagination.showing', { from, to, total: totalElements });
          }}
          className={
            embeddedInDashboard
              ? 'min-h-[calc(100vh-6rem)] bg-white dark:bg-background'
              : undefined
          }
          bodyClassName={embeddedInDashboard ? 'mx-4 sm:mx-5' : undefined}
        />
      </div>
    </div>
  );
}

export function MyRentalContractsPage({
  embeddedInDashboard = false,
}: MyRentalContractsPageProps = {}) {
  return (
    <MyRentalContractsProvider>
      <MyRentalContractsContent embeddedInDashboard={embeddedInDashboard} />
    </MyRentalContractsProvider>
  );
}
