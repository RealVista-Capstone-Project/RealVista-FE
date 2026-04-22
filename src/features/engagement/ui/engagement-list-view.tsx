'use client';

import * as React from 'react';
import { ChevronDown, FileSearch, Filter, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PaginationState } from '@tanstack/react-table';

import { Engagement } from '@/entities/engagement/model/types';
import { DataTable } from '@/shared/ui/data-table';
import { Spinner } from '@/shared/ui/spinner';
import { cn } from '@/shared/lib/utils';
import { formatNumber } from '@/shared/lib/utils/format-currency';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';

import { useEngagementColumns } from './engagement-columns';
import { EngagementDetailPanel } from './engagement-detail-panel';
import type { EngagementTab } from './engagement-search-header';

interface EngagementListViewProps {
  engagements: Engagement[];
  totalElements: number;
  isLoading: boolean;
  isError: boolean;
  tab: EngagementTab;
  onTabChange: (tab: EngagementTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onCancel: (id: string, reason?: string) => void;
  onFinish: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  currentUserId?: string;
  selectedEngagement?: Engagement | null;
  onSelect?: (engagement: Engagement) => void;
}

type StatusFilter = 'all' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'FINISHED';

export const EngagementListView = ({
  engagements,
  totalElements,
  isLoading,
  isError,
  tab,
  onTabChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onCancel,
  onFinish,
  onAccept,
  onReject,
  currentUserId,
  selectedEngagement,
  onSelect,
}: EngagementListViewProps) => {
  const t = useTranslations('Engagement');

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

  const hasActiveTab = tab !== 'sent';
  const hasActiveStatus = statusFilter !== 'all';
  const hasActiveFilter = hasActiveTab || hasActiveStatus;
  const activeFilterCount = (hasActiveTab ? 1 : 0) + (hasActiveStatus ? 1 : 0);

  const resetFilters = () => {
    onStatusFilterChange('all');
    onTabChange('sent');
    setIsFilterOpen(false);
  };

  const filterStatusOptions: { value: StatusFilter; labelKey: string }[] = [
    { value: 'SUBMITTED', labelKey: 'status.SUBMITTED' },
    { value: 'ACCEPTED', labelKey: 'status.ACCEPTED' },
    { value: 'REJECTED', labelKey: 'status.REJECTED' },
    { value: 'CANCELLED', labelKey: 'status.CANCELLED' },
    { value: 'FINISHED', labelKey: 'status.FINISHED' },
  ];

  const columns = useEngagementColumns({
    currentUserId,
    onCancel,
    onFinish,
    onAccept,
    onReject,
  });

  const pagination: PaginationState = {
    pageIndex: currentPage - 1,
    pageSize: itemsPerPage,
  };

  const toolbar = (
    <div className='flex flex-col gap-4 p-4 sm:p-5'>
      {/* Title row */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h2 className='text-xl font-bold text-foreground'>{t('page.title')}</h2>
          {/* Count badge */}
          <div className='flex items-center justify-center rounded-full bg-primary px-2 py-0.5'>
            <span className='text-sm font-bold text-white'>{formatNumber(totalElements ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Search + filter row */}
      <div className='flex items-center gap-3'>
        <div className='relative flex-1 max-w-md'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
            <Search className='h-5 w-5 text-muted-foreground/70' strokeWidth={2} />
          </div>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('filter.searchPlaceholder')}
            className='h-11 w-full rounded-lg border-2 border-primary/20 bg-primary/5 pl-12 pr-10 text-base font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-0'
          />
          {isSearchPending && (
            <span className='pointer-events-none absolute inset-y-0 right-4 flex items-center'>
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
              'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              hasActiveFilter
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-primary/20 bg-white text-foreground hover:bg-primary/5'
            )}
          >
            <Filter className='h-5 w-5' strokeWidth={2} />
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isFilterOpen && 'rotate-180')}
              strokeWidth={2}
            />
            {hasActiveFilter && (
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
              <div className='p-3 flex flex-col gap-4'>
                {/* Direction (tab) section */}
                <div>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    {t('filter.directionLabel')}
                  </p>
                  <div className='flex flex-col gap-1'>
                    {(['sent', 'received'] as const).map((t_tab) => (
                      <button
                        key={t_tab}
                        type='button'
                        onClick={() => onTabChange(t_tab)}
                        className={cn(
                          'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                          tab === t_tab
                            ? 'bg-primary/5 font-medium text-primary'
                            : 'text-foreground hover:bg-primary/5'
                        )}
                      >
                        {t(`tabs.${t_tab}`)}
                        {tab === t_tab && <X className='h-3.5 w-3.5' strokeWidth={2.5} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status section */}
                <div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isError) {
    return (
      <div className='p-4 sm:p-6 flex h-full items-center justify-center'>
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <FileSearch className='h-6 w-6 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('page.loadError')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-4 sm:p-6 flex gap-4 items-start'>
      <div className='flex-1 min-w-0'>
        <DataTable
          columns={columns}
          data={engagements}
          isLoading={isLoading}
          pageCount={totalPages}
          pagination={pagination}
          onPaginationChange={(updater) => {
            const next = typeof updater === 'function' ? updater(pagination) : updater;
            onPageChange(next.pageIndex + 1);
          }}
          toolbar={toolbar}
          emptyIcon={<FileSearch className='h-10 w-10 text-primary/40 mb-2' />}
          emptyTitle={t('table.empty')}
          pageInfoText={(current) => {
            const from = (current - 1) * itemsPerPage + 1;
            const to = Math.min(current * itemsPerPage, totalElements);
            return t('pagination.showing', { from, to, total: totalElements });
          }}
          onRowClick={onSelect}
          isRowSelected={(row) => row.engagementId === selectedEngagement?.engagementId}
        />
      </div>

      {selectedEngagement && onSelect && (
        <EngagementDetailPanel
          engagement={selectedEngagement}
          onClose={() => onSelect(selectedEngagement)}
          onCancel={onCancel}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};
