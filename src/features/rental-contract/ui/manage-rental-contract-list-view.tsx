'use client';

import * as React from 'react';
import { ChevronDown, FileSearch, Filter, Plus, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import type { PaginationState } from '@tanstack/react-table';

import { type RentalContract, RentalContractStatus } from '@/entities/rental-contract/model/types';
import { DataTable } from '@/shared/ui/data-table';
import { Spinner } from '@/shared/ui/spinner';
import { cn } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { useSyncDashboardTopNavCountBadge } from '@/shared/lib/dashboard-top-nav-badge-context';

import { useContractColumns } from './contract-columns';

interface ManageRentalContractListViewProps {
  contracts: RentalContract[];
  totalElements: number;
  isLoading: boolean;
  isError: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const ManageRentalContractListView = ({
  contracts,
  totalElements,
  isLoading,
  isError,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
}: ManageRentalContractListViewProps) => {
  const t = useTranslations('ManageRentalContract');
  const router = useRouter();

  useSyncDashboardTopNavCountBadge(isError || isLoading ? null : totalElements);

  const [inputValue, setInputValue] = React.useState(search);
  const debouncedInput = useDebounce(inputValue, 400);
  const isSearchPending = inputValue !== debouncedInput;

  React.useEffect(() => {
    onSearchChange(debouncedInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

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
    onStatusFilterChange('all');
    setIsFilterOpen(false);
  };

  const filterStatusOptions: { value: RentalContractStatus; labelKey: string }[] = [
    { value: RentalContractStatus.PENDING_RENTER, labelKey: 'filter.tabs.pendingRenter' },
    { value: RentalContractStatus.PENDING_LANDLORD, labelKey: 'filter.tabs.pendingLandlord' },
    { value: RentalContractStatus.ACTIVE, labelKey: 'filter.tabs.active' },
    { value: RentalContractStatus.EXPIRED, labelKey: 'filter.tabs.expired' },
    { value: RentalContractStatus.TERMINATED, labelKey: 'filter.tabs.terminated' },
  ];

  const columns = useContractColumns();

  const pagination: PaginationState = {
    pageIndex: currentPage - 1,
    pageSize: itemsPerPage,
  };

  const toolbar = (
    <div className='flex items-center gap-3 p-4 sm:p-5'>
      {/* Search */}
      <div className='relative min-w-0 flex-1 max-w-md'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
          <Search className='h-4 w-4 text-primary/55' strokeWidth={2.5} />
        </div>
        <input
          type='text'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('filter.searchPlaceholder')}
          className='h-9 w-full rounded-full border-2 border-primary/14 bg-[#e8f2fb] pl-10 pr-9 text-sm font-medium text-foreground placeholder:text-muted-foreground/65 shadow-sm shadow-primary/[0.04] transition-colors focus:border-primary/28 focus:bg-[#dfeef9] focus:outline-none focus:ring-0'
        />
        {isSearchPending && (
          <span className='pointer-events-none absolute inset-y-0 right-3.5 flex items-center'>
            <Spinner className='size-4 text-primary' />
          </span>
        )}
      </div>

      {/* Filter Button */}
      <div ref={filterRef} className='relative shrink-0'>
        <button
          type='button'
          onClick={() => setIsFilterOpen((prev) => !prev)}
          className={cn(
            'flex h-9 min-w-[2.75rem] cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 px-2.5 text-xs font-medium bg-white shadow-sm shadow-primary/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-1',
            hasActiveStatus
              ? 'border-primary/24 bg-primary/5 text-primary'
              : 'border-primary/14 text-foreground hover:border-primary/20 hover:bg-muted/30'
          )}
        >
          <Filter className='h-4 w-4 shrink-0 text-primary' strokeWidth={2} />
          <ChevronDown
            className={cn('h-3.5 w-3.5 shrink-0 text-primary transition-transform', isFilterOpen && 'rotate-180')}
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
                <span className='text-sm font-semibold text-foreground'>{t('filter.filterTitle')}</span>
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
                        onStatusFilterChange(opt.value);
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

      {/* Create Button */}
      <button
        type='button'
        onClick={() => router.push(ROUTES.dashboard.createRentalContract)}
        className='ml-auto flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
      >
        <Plus className='h-3.5 w-3.5' strokeWidth={2.5} />
        <span>{t('hero.createButton')}</span>
      </button>
    </div>
  );

  if (isError) {
    return (
      <div className='m-4 flex h-full items-center justify-center'>
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <FileSearch className='h-6 w-6 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='m-4'>
      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        pageCount={totalPages}
        pagination={pagination}
        onPaginationChange={(updater) => {
          const next = typeof updater === 'function' ? updater(pagination) : updater;
          onPageChange(next.pageIndex + 1);
        }}
        toolbar={toolbar}
        emptyIcon={<FileSearch className='h-10 w-10 text-primary/40 mb-2' />}
        emptyTitle={t('empty.title')}
        pageInfoText={(current) => {
          const from = (current - 1) * itemsPerPage + 1;
          const to = Math.min(current * itemsPerPage, totalElements);
          return t('pagination.showing', { from, to, total: totalElements });
        }}
        className='min-h-[calc(100vh-6rem)]'
        bodyClassName='mx-4 sm:mx-5'
      />
    </div>
  );
};