'use client';

import * as React from 'react';
import { Search, Filter, X, ChevronDown, Plus, Building2, Lock, Users, User, Briefcase } from 'lucide-react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/shared/config/i18n/navigation';
import { ListingCard } from './components/listing-card';
import { listingQueries } from '@/entities/listing/api';
import { ListingDetailPanel } from './components/listing-detail-panel';
import { Spinner } from '@/shared/ui/spinner';
import { formatNumber } from '@/shared/lib/utils/format-currency';
import type { Listing } from '@/entities/listing';
import { ListingStatus, ListingType } from '../types/managed-listing';
import { cn } from '@/shared/lib/utils';
import { useDebounce, useIsMobile } from '@/shared/lib/hooks';
import { useListingQuota } from '@/entities/billing';
import { useAuthSession } from '@/features/auth/model';

type TabType = ListingType | 'ALL';
type SortOption = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc';
type StatusFilter = ListingStatus | 'ALL';
type CreatorFilter = 'ALL' | 'SELF' | 'AGENT';

/**
 * Managed Listings Page
 *
 * Displays a list of properties managed by the current user.
 * Features:
 * - Property list with status badges
 * - Tabs to filter by listing type (All, Rent, Sale)
 * - Search functionality
 * - Status filter & sort via filter panel
 * - Infinite scroll on the list column (loads more as you scroll down)
 * - Detailed property view
 */
export function ManagedListingsPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const initialListingId = searchParams.get('listingId');
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedListingId, setSelectedListingId] = React.useState<string | null>(initialListingId);
  const [activeTab, setActiveTab] = React.useState<TabType>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');
  const [creatorFilter, setCreatorFilter] = React.useState<CreatorFilter>('ALL');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isCreatorFilterOpen, setIsCreatorFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);
  const creatorFilterRef = React.useRef<HTMLDivElement>(null);
  const listScrollRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const t = useTranslations('ManagedListings');
  const tDetail = useTranslations('ListingDetailPanel');
  const isMobile = useIsMobile();
  const { isLocked, isLoading: quotaLoading } = useListingQuota();
  const { data: session } = useAuthSession();
  // Backend role 'AGENT' is mapped to 'moderator' in session.user.role,
  // so we check backendRoles directly for the raw backend role.
  const isAgent = (session?.user as { backendRoles?: string[] } | undefined)?.backendRoles?.includes('AGENT') ?? false;

  const handleCreateListing = () => {
    router.push('/dashboard/listings/create');
  };

  // Fetch summary counts for tabs
  const { data: summary } = useQuery(listingQueries.managedSummary());

  // Fetch managed listings (infinite scroll)
  const infiniteParams = React.useMemo(
    () => ({
      size: 10,
      search: debouncedSearchQuery.trim() || undefined,
      listingType: activeTab,
      status: statusFilter,
      sortBy,
      createdBy: creatorFilter,
    }),
    [debouncedSearchQuery, activeTab, statusFilter, sortBy, creatorFilter]
  );

  const {
    data: infiniteData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(listingQueries.managedInfinite(infiniteParams));

  const listings = React.useMemo(
    () => infiniteData?.pages.flatMap((p) => p.content) ?? [],
    [infiniteData?.pages]
  );

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
    function handleClickOutside(e: MouseEvent) {
      if (creatorFilterRef.current && !creatorFilterRef.current.contains(e.target as Node)) {
        setIsCreatorFilterOpen(false);
      }
    }
    if (isCreatorFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCreatorFilterOpen]);

  React.useEffect(() => {
    const root = listScrollRef.current;
    const target = loadMoreRef.current;
    if (!root || !target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: '100px', threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // If the selected listing is not in the current result set (e.g. after filter), pick the first row
  React.useEffect(() => {
    if (listings.length === 0 || !selectedListingId) return;
    if (!listings.some((l) => l.listing_id === selectedListingId)) {
      setSelectedListingId(!isMobile ? listings[0].listing_id : null);
    }
  }, [listings, selectedListingId, isMobile]);

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
    setCreatorFilter('ALL');
    setIsFilterOpen(false);
    setIsCreatorFilterOpen(false);
  };

  const creatorOptions: CreatorFilter[] = ['ALL', 'SELF', 'AGENT'];

  // Select first listing by default (only on desktop)
  React.useEffect(() => {
    if (!isMobile && listings.length > 0 && !selectedListingId) {
      setSelectedListingId(listings[0].listing_id);
    }
  }, [listings, selectedListingId, isMobile]);

  const statusOptions: StatusFilter[] = [
    'ALL',
    ListingStatus.DRAFT,
    ListingStatus.PENDING,
    ListingStatus.PUBLISHED,
    ListingStatus.SOLD,
    ListingStatus.RENTED,
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

          {/* Create + search row (inside list column, below page chrome) */}
          <div className='px-4 pb-3 pt-3 sm:px-6 sm:pb-5 sm:pt-4'>
            <div className='mb-3 flex justify-end'>
              <button
                type='button'
                onClick={handleCreateListing}
                className='inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-4'
                aria-label={t('createButton')}
              >
                <Plus className='h-3.5 w-3.5 shrink-0' strokeWidth={2.5} />
                <span>{t('createButton')}</span>
              </button>
            </div>
            <div className='flex items-center gap-3'>
              <div className='relative min-w-0 flex-1'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
                  <Search className='h-4 w-4 text-primary/55' strokeWidth={2.5} />
                </div>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className='h-9 w-full rounded-full border-2 border-primary/14 bg-[#e8f2fb] pl-10 pr-9 text-sm font-medium text-foreground shadow-sm shadow-primary/[0.04] placeholder:text-muted-foreground/65 transition-colors focus:border-primary/28 focus:bg-[#dfeef9] focus:outline-none focus:ring-2 focus:ring-primary/15'
                />
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    className='absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground/60 hover:text-foreground focus-visible:outline-none'
                    aria-label={t('search.clear')}
                  >
                    <X className='h-3.5 w-3.5' strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Creator Filter Button — hidden for agents (they only create their own listings) */}
              {!isAgent && <div ref={creatorFilterRef} className='relative shrink-0'>
                <button
                  type='button'
                  onClick={() => setIsCreatorFilterOpen((prev) => !prev)}
                  className={cn(
                    'flex h-9 min-w-[2.75rem] cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 px-2.5 text-xs font-medium bg-white shadow-sm shadow-primary/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-1',
                    creatorFilter !== 'ALL'
                      ? 'border-primary/24 bg-primary/5 text-primary'
                      : 'border-primary/14 text-foreground hover:border-primary/20 hover:bg-muted/30'
                  )}
                  aria-label={t('creatorFilter.label')}
                >
                  {creatorFilter === 'SELF' ? (
                    <User className='h-4 w-4 text-primary' strokeWidth={2.5} />
                  ) : creatorFilter === 'AGENT' ? (
                    <Briefcase className='h-4 w-4 text-primary' strokeWidth={2.5} />
                  ) : (
                    <Users className='h-4 w-4 text-primary/55' strokeWidth={2.5} />
                  )}
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 text-primary/50 transition-transform', isCreatorFilterOpen && 'rotate-180')}
                    strokeWidth={2.5}
                  />
                </button>

                {isCreatorFilterOpen && (
                  <div className='absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-primary/20 bg-white shadow-lg'>
                    <div className='border-b border-primary/20 px-4 py-3'>
                      <span className='text-sm font-semibold text-foreground'>{t('creatorFilter.label')}</span>
                    </div>
                    <div className='p-2'>
                      {creatorOptions.map((c) => {
                        const labelKey = `creatorFilter.options.${c.toLowerCase()}` as Parameters<typeof t>[0];
                        return (
                          <button
                            key={c}
                            type='button'
                            onClick={() => { setCreatorFilter(c); setIsCreatorFilterOpen(false); }}
                            className={cn(
                              'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                              creatorFilter === c
                                ? 'bg-primary/5 font-medium text-primary'
                                : 'text-foreground hover:bg-primary/5'
                            )}
                          >
                            {t(labelKey)}
                            {creatorFilter === c && <X className='h-3.5 w-3.5' strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>}

              {/* Filter Button next to search bar */}
              <div ref={filterRef} className='relative shrink-0'>
                <button
                  type='button'
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  className={cn(
                    'flex h-9 min-w-[2.75rem] cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 px-2.5 text-xs font-medium bg-white shadow-sm shadow-primary/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-1',
                    hasActiveFilters
                      ? 'border-primary/24 bg-primary/5 text-primary'
                      : 'border-primary/14 text-foreground hover:border-primary/20 hover:bg-muted/30'
                  )}
                  aria-label={t('filter')}
                >
                  <Filter className='h-4 w-4 text-primary/55' strokeWidth={2.5} />
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 text-primary/50 transition-transform', isFilterOpen && 'rotate-180')}
                    strokeWidth={2.5}
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
                                onClick={() => { setStatusFilter(s); setIsFilterOpen(false); }}
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
                                onClick={() => { setSortBy(s); setIsFilterOpen(false); }}
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

          {/* Tabs — All / Rent / Sale; single bottom rule, flush to listing list */}
          <div className='border-b border-primary/20 px-4 sm:px-6 pt-1 pb-0 overflow-x-auto no-scrollbar'>
            <div className='flex min-w-max items-end gap-1.5'>
              <button
                type='button'
                onClick={() => setActiveTab('ALL')}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  activeTab === 'ALL'
                    ? 'relative z-[1] -mb-px border-b-2 border-primary bg-primary text-white'
                    : 'mb-0 border-b-2 border-transparent text-foreground/70 hover:bg-primary/5'
                )}
              >
                {t('tabs.all')}
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-bold',
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
                  'flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  activeTab === ListingType.RENT
                    ? 'relative z-[1] -mb-px border-b-2 border-primary bg-primary text-white'
                    : 'mb-0 border-b-2 border-transparent text-foreground/70 hover:bg-primary/5'
                )}
              >
                {t('tabs.forRent')}
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-bold',
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
                  'flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  activeTab === ListingType.SALE
                    ? 'relative z-[1] -mb-px border-b-2 border-primary bg-primary text-white'
                    : 'mb-0 border-b-2 border-transparent text-foreground/70 hover:bg-primary/5'
                )}
              >
                {t('tabs.forSale')}
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-bold',
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

          {/* Properties List */}
          <div ref={listScrollRef} className='flex-1 overflow-y-auto flex flex-col'>
            {isLoading ? (
              <div className='flex flex-1 items-center justify-center'>
                <Spinner className='size-8 text-primary' />
              </div>
            ) : isError && error ? (
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
                {hasActiveFilters || creatorFilter !== 'ALL' || debouncedSearchQuery ? (
                  <>
                    <p className='text-sm font-medium text-foreground'>{t('empty.noResults')}</p>
                    <p className='text-xs text-muted-foreground'>{t('empty.noResultsHint')}</p>
                    <button
                      type='button'
                      onClick={resetFilters}
                      className='flex cursor-pointer items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                    >
                      <X className='h-3.5 w-3.5' strokeWidth={2.5} />
                      <span>{t('filterPanel.reset')}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <p className='text-sm text-muted-foreground'>{t('empty.noProperties')}</p>
                    <button
                      type='button'
                      onClick={handleCreateListing}
                      className='flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                    >
                      <Plus className='h-4 w-4' strokeWidth={2.5} />
                      <span>{t('createButton')}</span>
                    </button>
                  </>
                )}
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
                {hasNextPage ? (
                  <div
                    ref={loadMoreRef}
                    className='flex min-h-12 items-center justify-center py-3'
                    aria-hidden
                  >
                    {isFetchingNextPage ? (
                      <Spinner className='size-6 text-primary' />
                    ) : null}
                  </div>
                ) : null}
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
