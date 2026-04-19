'use client';

import * as React from 'react';
import {
  ManageRentalContractProvider,
  useManageRentalContractContext,
} from '@/features/rental-contract/model/manage-rental-contract-context';
import { ContractListItem } from '@/features/rental-contract/ui/contract-list-item';
import { ContractDetailPanel } from '@/features/rental-contract/ui/contract-detail-panel';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/utils';
import {
  ChevronDown,
  FileSearch,
  Filter,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/shared/ui/spinner';
import { RealVistaPagination } from '@/shared/ui/realvista-pagination/realvista-pagination';
import { useIsMobile } from '@/shared/lib/hooks';
import { formatNumber } from '@/shared/lib/utils/format-currency';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';

type StatusTab = 'all' | 'PENDING_RENTER' | 'PENDING_LANDLORD' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

function ManageRentalContractContent() {
  const router = useRouter();
  const {
    contracts,
    currentPage,
    handleContractClick,
    isError,
    isLoading,
    searchQuery: contextSearchQuery,
    selectedContract,
    setCurrentPage,
    setSearchQuery,
    setSelectedContract,
    setStatusFilter,
    statusFilter,
    totalElements,
    totalPages,
  } = useManageRentalContractContext();

  const isMobile = useIsMobile();
  const t = useTranslations('ManageRentalContract');
  const tStatus = useTranslations('RentalContract.status');

  // Local input value with debounce (the context sets search on every change but we debounce)
  const [inputValue, setInputValue] = React.useState(contextSearchQuery);
  const debouncedInput = useDebounce(inputValue, 400);

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  // Sync debounced input → context search
  React.useEffect(() => {
    setSearchQuery(debouncedInput);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  const isSearchPending = inputValue !== debouncedInput;

  const activeTab = statusFilter as StatusTab;
  const hasActiveTab = activeTab !== 'all';

  const resetFilters = () => {
    setStatusFilter('all');
    setIsFilterOpen(false);
  };

  // Close filter on outside click
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



  const filterStatusOptions: { value: StatusTab; labelKey: string }[] = [
    { value: 'PENDING_RENTER', labelKey: 'filter.tabs.pendingRenter' },
    { value: 'PENDING_LANDLORD', labelKey: 'filter.tabs.pendingLandlord' },
    { value: 'ACTIVE', labelKey: 'filter.tabs.active' },
    { value: 'EXPIRED', labelKey: 'filter.tabs.expired' },
    { value: 'TERMINATED', labelKey: 'filter.tabs.terminated' },
  ];

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Spinner className='size-8 text-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-full items-center justify-center'>
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
    <div className='flex h-full overflow-hidden flex-col sm:flex-row'>
      {/* Left Sidebar — Contract List */}
      <aside
        className={cn(
          'flex-col border-r border-primary/20 bg-white transition-all duration-300',
          isMobile
            ? selectedContract ? 'hidden' : 'flex w-full'
            : 'flex w-[460px]'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-b border-primary/20 p-4 sm:p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h2 className='text-xl font-bold text-foreground'>{t('hero.shortTitle')}</h2>
                <div className='flex items-center justify-center rounded-full bg-primary px-2 py-0.5'>
                  <span className='text-sm font-bold text-white'>{formatNumber(totalElements)}</span>
                </div>
              </div>

              {/* Create Button */}
              <button
                type='button'
                onClick={() => router.push(ROUTES.dashboard.createRentalContract)}
                className='flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              >
                <Plus className='h-3.5 w-3.5' strokeWidth={2.5} />
                <span>{t('hero.createButton')}</span>
              </button>
            </div>
          </div>



          {/* Search Bar + Filter Button */}
          <div className='border-b border-primary/20 p-4 sm:p-6'>
            <div className='flex items-center gap-3'>
              <div className='relative flex-1'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                  <Search className='h-5 w-5 text-muted-foreground/70' strokeWidth={2} />
                </div>
                <input
                  type='text'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('filter.searchPlaceholder')}
                  className='h-12 w-full rounded-lg border-2 border-primary/20 bg-primary/5 pl-12 pr-10 text-base font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-0'
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
                    'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    hasActiveTab
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-primary/20 bg-white text-foreground hover:bg-primary/5'
                  )}
                >
                  <Filter className='h-5 w-5' strokeWidth={2} />
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', isFilterOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                  {hasActiveTab && (
                    <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
                      1
                    </span>
                  )}
                </button>

                {/* Filter Dropdown */}
                {isFilterOpen && (
                  <div className='absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-primary/20 bg-white shadow-lg'>
                    <div className='flex items-center justify-between border-b border-primary/20 px-4 py-3'>
                      <span className='text-sm font-semibold text-foreground'>{t('filter.filterTitle')}</span>
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
                              activeTab === opt.value
                                ? 'bg-primary/5 font-medium text-primary'
                                : 'text-foreground hover:bg-primary/5'
                            )}
                          >
                            {t(opt.labelKey as Parameters<typeof t>[0])}
                            {activeTab === opt.value && <X className='h-3.5 w-3.5' strokeWidth={2.5} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract List */}
          <div className='flex-1 overflow-y-auto flex flex-col'>
            {contracts.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-4 p-8 text-center flex-1'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
                  <FileSearch className='h-6 w-6 text-primary' aria-hidden='true' />
                </div>
                <div>
                  <p className='font-semibold text-foreground'>{t('empty.title')}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>{t('empty.subtitle')}</p>
                </div>
              </div>
            ) : (
              <div className='divide-y divide-border'>
                {contracts.map((contract) => (
                  <ContractListItem
                    key={contract.id}
                    contract={contract}
                    isSelected={selectedContract?.id === contract.id}
                    onClick={handleContractClick}
                  />
                ))}
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='py-6 bg-white border-t border-primary/20'>
                    <RealVistaPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(p) => setCurrentPage(p)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right Panel — Contract Detail */}
      <main
        className={cn(
          'flex-1 overflow-y-auto bg-primary/5',
          isMobile ? (selectedContract ? 'block' : 'hidden') : 'block'
        )}
      >
        {selectedContract ? (
          <ContractDetailPanel
            contract={selectedContract}
            onClose={() => setSelectedContract(null)}
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <p className='text-sm text-muted-foreground'>{t('detail.emptyTitle')}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export function ManageRentalContractPage() {
  return (
    <ManageRentalContractProvider>
      <ManageRentalContractContent />
    </ManageRentalContractProvider>
  );
}
