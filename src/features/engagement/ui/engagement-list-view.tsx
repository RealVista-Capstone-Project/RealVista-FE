'use client';

import * as React from 'react';
import { ChevronDown, FileSearch, Filter, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PaginationState } from '@tanstack/react-table';

import { Engagement } from '@/entities/engagement/model/types';
import { DataTable } from '@/shared/ui/data-table';
import { Spinner } from '@/shared/ui/spinner';
import { cn } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { useSyncDashboardTopNavCountBadge } from '@/shared/lib/dashboard-top-nav-badge-context';

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
    { value: 'all', labelKey: 'filter.all' },
    { value: 'SUBMITTED', labelKey: 'status.SUBMITTED' },
    { value: 'ACCEPTED', labelKey: 'status.ACCEPTED' },
    { value: 'REJECTED', labelKey: 'status.REJECTED' },
    { value: 'CANCELLED', labelKey: 'status.CANCELLED' },
    { value: 'FINISHED', labelKey: 'status.FINISHED' },
  ];
  const directionOptions: { value: EngagementTab; label: string }[] = [
    { value: 'all', label: t('filter.all') },
    { value: 'sent', label: t('tabs.sent') },
    { value: 'received', label: t('tabs.received') },
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
      {/* Search + filter row — match managed listings / manage agent */}
      <div className='flex items-center gap-3'>
        <div className='relative min-w-0 flex-1'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
            <Search className='h-4 w-4 text-primary/55' strokeWidth={2.5} />
          </div>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('filter.searchPlaceholder')}
            className='h-9 w-full rounded-full border-2 border-primary/14 bg-[#e8f2fb] pl-10 pr-9 text-sm font-medium text-foreground placeholder:text-muted-foreground/65 shadow-sm shadow-primary/[0.04] transition-colors focus:border-primary/28 focus:bg-[#dfeef9] focus:outline-none focus:ring-2 focus:ring-primary/15'
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
              hasActiveFilter
                ? 'border-primary/24 bg-primary/5 text-primary'
                : 'border-primary/14 text-foreground hover:border-primary/20 hover:bg-muted/30'
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
              <div className='flex flex-col gap-4 p-4'>
                {/* Direction (tab) section */}
                <div>
                  <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    {t('filter.directionLabel')}
                  </p>
                  <div className='flex flex-col gap-1'>
                    {directionOptions.map((option) => (
                      <button
                        key={option.value}
                        type='button'
                        onClick={() => onTabChange(option.value)}
                        className={cn(
                          'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                          tab === option.value
                            ? 'bg-primary/5 font-medium text-primary'
                            : 'text-foreground hover:bg-primary/5'
                        )}
                      >
                        {option.label}
                        {tab === option.value && <X className='h-3.5 w-3.5' strokeWidth={2.5} />}
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
      <div className='flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6'>
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
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6'>
      <div className='flex min-h-0 flex-1 gap-6'>
        <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
          <DataTable
            className='flex min-h-0 flex-1 flex-col overflow-hidden'
            bodyClassName='mx-4 sm:mx-5'
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
          <div className='flex min-h-0 w-[380px] shrink-0 flex-col self-stretch'>
            <EngagementDetailPanel
              engagement={selectedEngagement}
              onClose={() => onSelect(selectedEngagement)}
              onCancel={onCancel}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </div>
    </div>
  );
};
