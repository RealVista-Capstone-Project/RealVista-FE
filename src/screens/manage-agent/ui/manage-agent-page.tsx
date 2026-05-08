'use client';

import * as React from 'react';
import {
  ManageAgentProvider,
  useManageAgentContext,
} from '@/features/agent-engagement/model/manage-agent-context';
import { useAgentColumns } from '@/features/agent-engagement/ui/agent-columns';
import { AgentDetailPanel } from '@/features/agent-engagement/ui/agent-detail-panel';
import { cn } from '@/shared/lib/utils';
import { ChevronDown, Filter, Search, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/shared/ui/spinner';
import { DataTable } from '@/shared/ui/data-table';
import { useSyncDashboardTopNavCountBadge } from '@/shared/lib/dashboard-top-nav-badge-context';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import type { PaginationState } from '@tanstack/react-table';
import type { AgentEngagement } from '@/entities/agent-engagement';

function ManageAgentContent() {
  const {
    agents,
    currentPage,
    isError,
    isLoading,
    searchQuery: contextSearchQuery,
    setCurrentPage,
    setSearchQuery,
    setStatusFilter,
    statusFilter,
    totalElements,
    totalPages,
    ITEMS_PER_PAGE,
    selectedAgent,
    handleAgentClick,
    setSelectedAgent,
  } = useManageAgentContext();

  useSyncDashboardTopNavCountBadge(isError || isLoading ? null : totalElements);

  const t = useTranslations('ManageAgent');

  const [inputValue, setInputValue] = React.useState(contextSearchQuery);
  const debouncedInput = useDebounce(inputValue, 400);

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSearchQuery(debouncedInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  const isSearchPending = inputValue !== debouncedInput;

  const hasActiveFilter = statusFilter !== 'all';

  const resetFilters = () => {
    setStatusFilter('all');
    setIsFilterOpen(false);
  };

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  type StatusOption = { value: string; labelKey: string };
  const filterStatusOptions: StatusOption[] = [
    { value: 'ACCEPTED', labelKey: 'filter.tabs.accepted' },
    { value: 'FINISHED', labelKey: 'filter.tabs.finished' },
    { value: 'CANCELLED', labelKey: 'filter.tabs.cancelled' },
  ];

  const columns = useAgentColumns();

  const pagination: PaginationState = {
    pageIndex: currentPage - 1,
    pageSize: ITEMS_PER_PAGE,
  };

  const toolbar = (
    <div className='flex flex-col gap-4 p-4 sm:p-5'>
      {/* Search + filter row — match managed listings controls */}
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
              className={cn('h-3.5 w-3.5 shrink-0 text-primary transition-transform', isFilterOpen && 'rotate-180')}
              strokeWidth={2}
            />
            {hasActiveFilter && (
              <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
                1
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
                  className='cursor-pointer text-xs font-medium text-primary hover:underline focus-visible:outline-none'
                >
                  {t('filter.reset')}
                </button>
              </div>
              <div className='p-4'>
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

  if (isError) {
    return (
      <div className='flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6'>
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Users className='h-6 w-6 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6'>
      <div className='flex min-h-0 flex-1 gap-6'>
        {/* Main table */}
        <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
          <DataTable
            className='flex min-h-0 flex-1 flex-col overflow-hidden'
            bodyClassName='mx-4 sm:mx-5'
            columns={columns}
            data={agents}
            isLoading={isLoading}
            pageCount={totalPages}
            pagination={pagination}
            onPaginationChange={(updater) => {
              const next = typeof updater === 'function' ? updater(pagination) : updater;
              setCurrentPage(next.pageIndex + 1);
            }}
            toolbar={toolbar}
            emptyIcon={<Users className='mb-2 h-10 w-10 text-primary/40' />}
            emptyTitle={t('empty.title')}
            emptyDescription={t('empty.subtitle')}
            pageInfoText={(current) => {
              const from = (current - 1) * ITEMS_PER_PAGE + 1;
              const to = Math.min(current * ITEMS_PER_PAGE, totalElements);
              return t('pagination.showing', { from, to, total: totalElements });
            }}
            onRowClick={(agent: AgentEngagement) => handleAgentClick(agent)}
            isRowSelected={(agent: AgentEngagement) =>
              selectedAgent?.engagement_id === agent.engagement_id
            }
          />
        </div>

        {/* Detail panel */}
        {selectedAgent && (
          <div className='flex min-h-0 w-[380px] shrink-0 flex-col self-stretch'>
            <AgentDetailPanel
              agent={selectedAgent}
              onClose={() => setSelectedAgent(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ManageAgentPage() {
  return (
    <ManageAgentProvider>
      <div className='flex min-h-0 flex-1 flex-col'>
        <ManageAgentContent />
      </div>
    </ManageAgentProvider>
  );
}
