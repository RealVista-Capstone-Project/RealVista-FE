'use client';

import * as React from 'react';
import { Search, Filter, X, ChevronDown, Plus, Building2, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ListingCard } from './components/listing-card';
import { listingQueries } from '@/entities/listing/api';
import { ListingDetailPanel } from './components/listing-detail-panel';
import { RealVistaPagination } from '@/shared/ui/realvista-pagination/realvista-pagination';
import { Spinner } from '@/shared/ui/spinner';
import { formatNumber } from '@/shared/lib/utils/format-currency';
import type { Listing } from '@/entities/listing';
import { ListingStatus, ListingType } from '../types/managed-listing';
import { cn } from '@/shared/lib/utils';
import { useDebounce, useIsMobile } from '@/shared/lib/hooks';
import { useListingQuota } from '@/entities/billing';

type TabType = ListingType | 'ALL';
type SortOption = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc';
type StatusFilter = ListingStatus | 'ALL';

/**
 * Managed Listings Page
 *
 * Displays a list of properties managed by the current user.
 * Features:
 * - Property list with status badges
 * - Tabs to filter by listing type (All, Rent, Sale)
 * - Search functionality
 * - Status filter & sort via filter panel
 * - Detailed property view
 */
export function ManagedListingsPage() {
  const searchParams = useSearchParams();
  const initialListingId = searchParams.get('listingId');
  const router = useRouter();
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedListingId, setSelectedListingId] = React.useState<string | null>(initialListingId);
  const [activeTab, setActiveTab] = React.useState<TabType>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');
  const [page, setPage] = React.useState(0);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);
  const t = useTranslations('ManagedListings');
  const tDetail = useTranslations('ListingDetailPanel');
  const isMobile = useIsMobile();
  const { isLocked, isLoading: quotaLoading } = useListingQuota();

  const handleCreateListing = () => {
    router.push(`/${locale}/dashboard/listings/create`);
  };

  // Fetch summary counts for tabs
  const { data: summary } = useQuery(listingQueries.managedSummary());

  // Fetch paginated, filtered, and sorted listings
  const {
    data: listingPage,
    isLoading,
    error,
  } = useQuery(
    listingQueries.managed({
      page,
      size: 10,
      search: debouncedSearchQuery,
      listingType: activeTab,
      status: statusFilter,
      sortBy: sortBy,
    })
  );

  const listings = React.useMemo(() => listingPage?.content || [], [listingPage]);

  // Use centralized listing query
  const { data: listingResponse, isLoading: isDetailLoading } = useQuery({
    ...listingQueries.detail(selectedListingId || ''),
    enabled: !!selectedListingId,
    // Poll every 2 minutes so status changes from the expiry scheduler
    // (which runs hourly) are reflected without a manual page refresh.
    refetchInterval: 2 * 60 * 1000,
  });

  // Extract listing detail from response
  const listingDetail = listingResponse?.payload.data as Listing | undefined;

  // Close filter panel on outside click
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

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, activeTab, statusFilter, sortBy]);

  // Count listings by type from summary API
  const listingCounts = React.useMemo(() => {
    return {
      all: summary?.all || 0,
      rent: summary?.rent || 0,
      sale: summary?.sale || 0,
    };
  }, [summary]);

  // Whether any filter is active (beyond defaults)
  const hasActiveFilters = statusFilter !== 'ALL' || sortBy !== 'newest';

  const resetFilters = () => {
    setStatusFilter('ALL');
    setSortBy('newest');
    setIsFilterOpen(false);
  };

  // Select first listing by default (only on desktop)
  React.useEffect(() => {
    if (!isMobile && listings.length > 0 && !selectedListingId) {
      setSelectedListingId(listings[0].listing_id);
    }
  }, [listings, selectedListingId, isMobile]);

  // Clear selection if listing is not in current page
  React.useEffect(() => {
    if (
      selectedListingId &&
      listings.length > 0 &&
      !listings.find((l) => l.listing_id === selectedListingId)
    ) {
      // Don't auto-reset selection when paginating if possible,
      // but here we keep the original logic adapted to pages
      // setSelectedListingId(listings[0].listing_id);
    }
  }, [listings, selectedListingId]);

  const statusOptions: StatusFilter[] = [
    'ALL',
    ListingStatus.DRAFT,
    ListingStatus.PENDING,
    ListingStatus.PUBLISHED,
    ListingStatus.SOLD,
    ListingStatus.RENTED,
    ListingStatus.ARCHIVED,
  ];

  const sortOptions: SortOption[] = ['newest', 'oldest', 'priceAsc', 'priceDesc'];

  return (
    <div className='flex h-full overflow-hidden flex-col sm:flex-row'>
      {/* Left Sidebar - Properties List */}
      <aside
        className={cn(
          'flex-col border-r border-primary/20 bg-white transition-all duration-300',
          isMobile ? (selectedListingId ? 'hidden' : 'flex w-full') : 'flex w-[460px]'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-b border-primary/20 p-4 sm:p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h2 className='text-xl font-bold text-foreground'>{t('title')}</h2>
                <div className='flex items-center justify-center rounded-full bg-primary px-2 py-0.5'>
                  <span className='text-sm font-bold text-white'>
                    {formatNumber(listingCounts.all)}
                  </span>
                </div>
              </div>

              {/* Create Button at the end of header */}
              <button
                type='button'
                onClick={handleCreateListing}
                className='flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                aria-label={t('createButton')}
              >
                <Plus className='h-3.5 w-3.5' strokeWidth={2.5} />
                <span>{t('createButton')}</span>
              </button>
            </div>
          </div>

          {/* Subscription Gate */}
          {isLocked && !quotaLoading && (
            <div className='border-b border-purple-92/50 px-4 sm:px-6 py-4'>
              <div className='border border-dashed border-amber-300 rounded-lg bg-amber-50 p-6 text-center'>
                <Lock className='w-8 h-8 text-amber-500 mx-auto mb-3' />
                <h3 className='text-sm font-semibold text-main-black mb-1'>
                  {tDetail('subscriptionGate.title')}
                </h3>
                <p className='text-xs text-grey-500 mb-4'>
                  {tDetail('subscriptionGate.description')}
                </p>
                <button
                  type='button'
                  onClick={() => router.push(`/${locale}/subscribe`)}
                  className='inline-flex items-center justify-center rounded-lg bg-main-black text-white text-xs font-semibold px-6 py-2 hover:bg-main-black/80 transition-colors cursor-pointer'
                >
                  {tDetail('subscriptionGate.cta')}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className='border-b border-primary/20 px-4 sm:px-6 pt-4 overflow-x-auto no-scrollbar'>
            <div className='flex gap-1 min-w-max'>
              <button
                type='button'
                onClick={() => setActiveTab('ALL')}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  activeTab === 'ALL'
                    ? 'bg-primary text-white'
                    : 'bg-transparent text-foreground/70 hover:bg-primary/5'
                )}
              >
                {t('tabs.all')}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-primary/15 text-foreground'
                  )}
                >
                  {formatNumber(listingCounts.all)}
                </span>
              </button>
              <button
                type='button'
                onClick={() => setActiveTab(ListingType.RENT)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  activeTab === ListingType.RENT
                    ? 'bg-primary text-white'
                    : 'bg-transparent text-foreground/70 hover:bg-primary/5'
                )}
              >
                {t('tabs.forRent')}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    activeTab === ListingType.RENT
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/15 text-foreground'
                  )}
                >
                  {formatNumber(listingCounts.rent)}
                </span>
              </button>
              <button
                type='button'
                onClick={() => setActiveTab(ListingType.SALE)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  activeTab === ListingType.SALE
                    ? 'bg-primary text-white'
                    : 'bg-transparent text-foreground/70 hover:bg-primary/5'
                )}
              >
                {t('tabs.forSale')}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    activeTab === ListingType.SALE
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/15 text-foreground'
                  )}
                >
                  {formatNumber(listingCounts.sale)}
                </span>
              </button>
            </div>
          </div>

          {/* Search bar + Filter */}
          <div className='border-b border-primary/20 p-4 sm:p-6'>
            <div className='flex items-center gap-3'>
              <div className='relative flex-1'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                  <Search className='h-5 w-5 text-muted-foreground/70' strokeWidth={2} />
                </div>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className='h-12 w-full rounded-lg border-2 border-primary/20 bg-primary/5 pl-12 pr-4 text-base font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-0'
                />
              </div>

              {/* Filter Button next to search bar */}
              <div ref={filterRef} className='relative shrink-0'>
                <button
                  type='button'
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  className={cn(
                    'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    hasActiveFilters
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-primary/20 bg-white text-foreground hover:bg-primary/5'
                  )}
                  aria-label={t('filter')}
                >
                  <Filter className='h-5 w-5' strokeWidth={2} />
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', isFilterOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                  {hasActiveFilters && (
                    <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
                      {(statusFilter !== 'ALL' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0)}
                    </span>
                  )}
                </button>

                {/* Filter Dropdown Panel */}
                {isFilterOpen && (
                  <div className='absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-primary/20 bg-white shadow-lg'>
                    <div className='flex items-center justify-between border-b border-primary/20 px-4 py-3'>
                      <span className='text-sm font-semibold text-foreground'>{t('filter')}</span>
                      <button
                        type='button'
                        onClick={resetFilters}
                        className='cursor-pointer text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
                      >
                        {t('filterPanel.reset')}
                      </button>
                    </div>

                    <div className='p-4 space-y-4'>
                      {/* Status Filter */}
                      <div>
                        <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                          {t('filterPanel.status')}
                        </p>
                        <div className='flex flex-col gap-1'>
                          {statusOptions.map((s) => {
                            const labelKey =
                              `filterPanel.statusOptions.${s === 'ALL' ? 'all' : s.toLowerCase()}` as Parameters<
                                typeof t
                              >[0];
                            return (
                              <button
                                key={s}
                                type='button'
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                  'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                                  statusFilter === s
                                    ? 'bg-primary/5 font-medium text-primary'
                                    : 'text-foreground hover:bg-primary/5'
                                )}
                              >
                                {t(labelKey)}
                                {statusFilter === s && (
                                  <X className='h-3.5 w-3.5' strokeWidth={2.5} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sort By */}
                      <div>
                        <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                          {t('filterPanel.sortBy')}
                        </p>
                        <div className='flex flex-col gap-1'>
                          {sortOptions.map((s) => {
                            const labelKey = `filterPanel.sortOptions.${s}` as Parameters<
                              typeof t
                            >[0];
                            return (
                              <button
                                key={s}
                                type='button'
                                onClick={() => setSortBy(s)}
                                className={cn(
                                  'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                                  sortBy === s
                                    ? 'bg-primary/5 font-medium text-primary'
                                    : 'text-foreground hover:bg-primary/5'
                                )}
                              >
                                {t(labelKey)}
                                {sortBy === s && <X className='h-3.5 w-3.5' strokeWidth={2.5} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Properties List */}
          <div className='flex-1 overflow-y-auto flex flex-col'>
            {isLoading ? (
              <div className='flex flex-1 items-center justify-center'>
                <Spinner className='size-8 text-primary' />
              </div>
            ) : error ? (
              <div className='flex flex-1 items-center justify-center'>
                <div className='text-center'>
                  <p className='text-lg font-semibold text-foreground'>{t('error.title')}</p>
                  <p className='mt-2 text-sm text-muted-foreground'>{error.message}</p>
                </div>
              </div>
            ) : listings.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-4 p-8 text-center flex-1'>
                <div className='flex h-12 w-14 items-center justify-center rounded-full bg-primary/10'>
                  <Building2 className='h-7 w-7 text-primary' strokeWidth={1.5} />
                </div>
                <p className='text-sm text-muted-foreground'>{t('empty.noProperties')}</p>
                <button
                  type='button'
                  onClick={handleCreateListing}
                  className='flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                >
                  <Plus className='h-4 w-4' strokeWidth={2.5} />
                  <span>{t('createButton')}</span>
                </button>
              </div>
            ) : (
              <div className='divide-y divide-border'>
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.listing_id}
                    listing={listing}
                    isSelected={listing.listing_id === selectedListingId}
                    onClick={() => setSelectedListingId(listing.listing_id)}
                  />
                ))}
                {/* Pagination Controls */}
                {listingPage && listingPage.total_pages > 1 && (
                  <div className='py-6 bg-white border-t border-primary/20'>
                    <RealVistaPagination
                      currentPage={page + 1}
                      totalPages={listingPage.total_pages}
                      onPageChange={(p) => setPage(p - 1)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right Content - Property Detail */}
      <main
        className={cn(
          'flex-1 overflow-y-auto bg-primary/5',
          isMobile ? (selectedListingId ? 'block' : 'hidden') : 'block'
        )}
      >
        {listingDetail && !isDetailLoading ? (
          <ListingDetailPanel
            key={listingDetail.listing_id}
            listing={listingDetail}
            onBack={() => setSelectedListingId(null)}
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            {isDetailLoading ? (
              <Spinner className='size-8 text-primary' />
            ) : (
              <p className='text-sm text-muted-foreground'>{t('empty.selectProperty')}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
