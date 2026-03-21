'use client';

import * as React from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ListingCard } from './components/listing-card';
import { listingQueries } from '@/entities/listing/api';
import { ListingDetailPanel } from './components/listing-detail-panel';
import type { Listing } from '@/entities/listing';
import { ListingStatus, type ListingType } from '../types/managed-listing';
import { cn } from '@/shared/lib/utils';

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedListingId, setSelectedListingId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);
  const t = useTranslations('ManagedListings');

  const { data: listings, isLoading, error } = useQuery(listingQueries.managed());

  // Use centralized listing query
  const { data: listingResponse, isLoading: isDetailLoading } = useQuery({
    ...listingQueries.detail(selectedListingId || ''),
    enabled: !!selectedListingId,
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

  // Filter + sort listings
  const filteredListings = React.useMemo(() => {
    if (!listings) return [];

    let result = listings;

    // Filter by tab (listing type)
    if (activeTab !== 'ALL') {
      result = result.filter((l) => l.listing_type === activeTab);
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter((l) => l.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((l) => {
        const address = l.full_address?.toLowerCase() || '';
        return l.name.toLowerCase().includes(query) || address.includes(query);
      });
    }

    // Sort
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [listings, activeTab, statusFilter, searchQuery, sortBy]);

  // Count listings by type
  const listingCounts = React.useMemo(() => {
    if (!listings) return { all: 0, rent: 0, sale: 0 };
    return {
      all: listings.length,
      rent: listings.filter((l) => l.listing_type === 'RENT').length,
      sale: listings.filter((l) => l.listing_type === 'SALE').length,
    };
  }, [listings]);

  // Whether any filter is active (beyond defaults)
  const hasActiveFilters = statusFilter !== 'ALL' || sortBy !== 'newest';

  const resetFilters = () => {
    setStatusFilter('ALL');
    setSortBy('newest');
    setIsFilterOpen(false);
  };

  // Select first listing by default
  React.useEffect(() => {
    if (filteredListings.length > 0 && !selectedListingId) {
      setSelectedListingId(filteredListings[0].listing_id);
    }
  }, [filteredListings, selectedListingId]);

  // Clear selection if listing is not in filtered list
  React.useEffect(() => {
    if (
      selectedListingId &&
      filteredListings.length > 0 &&
      !filteredListings.find((l) => l.listing_id === selectedListingId)
    ) {
      setSelectedListingId(filteredListings[0].listing_id);
    }
  }, [filteredListings, selectedListingId]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-98 border-t-main-primary' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <p className='text-lg font-semibold text-main-black'>{t('error.title')}</p>
          <p className='mt-2 text-sm text-main-secondary/60'>{error.message}</p>
        </div>
      </div>
    );
  }

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
    <div className='flex h-[calc(100vh-96px)] overflow-hidden'>
      {/* Left Sidebar - Properties List */}
      <aside className='w-[460px] border-r border-purple-92/50 bg-white'>
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-b border-purple-92/50 p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h2 className='text-xl font-bold text-main-black'>{t('title')}</h2>
                <div className='flex items-center justify-center rounded-lg bg-main-primary px-2 py-1'>
                  <span className='text-sm font-bold text-white'>{filteredListings.length}</span>
                </div>
              </div>

              {/* Filter Button + Panel */}
              <div ref={filterRef} className='relative'>
                <button
                  type='button'
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                    hasActiveFilters
                      ? 'border-main-primary bg-purple-96 text-main-primary'
                      : 'border-purple-92 bg-white text-main-black hover:bg-purple-98'
                  )}
                  aria-label={t('filter')}
                >
                  <Filter className='h-4 w-4' strokeWidth={2} />
                  <span>{t('filter')}</span>
                  {hasActiveFilters && (
                    <span className='flex h-4 w-4 items-center justify-center rounded-full bg-main-primary text-[10px] font-bold text-white'>
                      {(statusFilter !== 'ALL' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0)}
                    </span>
                  )}
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', isFilterOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                </button>

                {/* Filter Dropdown Panel */}
                {isFilterOpen && (
                  <div className='absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-purple-92 bg-white shadow-lg'>
                    <div className='flex items-center justify-between border-b border-purple-92/50 px-4 py-3'>
                      <span className='text-sm font-semibold text-main-black'>{t('filter')}</span>
                      <button
                        type='button'
                        onClick={resetFilters}
                        className='text-xs font-medium text-main-primary hover:underline'
                      >
                        {t('filterPanel.reset')}
                      </button>
                    </div>

                    <div className='p-4 space-y-4'>
                      {/* Status Filter */}
                      <div>
                        <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-main-secondary/60'>
                          {t('filterPanel.status')}
                        </p>
                        <div className='flex flex-col gap-1'>
                          {statusOptions.map((s) => {
                            const labelKey = `filterPanel.statusOptions.${s === 'ALL' ? 'all' : s.toLowerCase()}` as Parameters<typeof t>[0];
                            return (
                              <button
                                key={s}
                                type='button'
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                                  statusFilter === s
                                    ? 'bg-purple-96 font-medium text-main-primary'
                                    : 'text-main-black hover:bg-purple-98'
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
                        <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-main-secondary/60'>
                          {t('filterPanel.sortBy')}
                        </p>
                        <div className='flex flex-col gap-1'>
                          {sortOptions.map((s) => {
                            const labelKey = `filterPanel.sortOptions.${s}` as Parameters<typeof t>[0];
                            return (
                              <button
                                key={s}
                                type='button'
                                onClick={() => setSortBy(s)}
                                className={cn(
                                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                                  sortBy === s
                                    ? 'bg-purple-96 font-medium text-main-primary'
                                    : 'text-main-black hover:bg-purple-98'
                                )}
                              >
                                {t(labelKey)}
                                {sortBy === s && (
                                  <X className='h-3.5 w-3.5' strokeWidth={2.5} />
                                )}
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

          {/* Tabs */}
          <div className='border-b border-purple-92/50 px-6 pt-4'>
            <div className='flex gap-1'>
              <button
                type='button'
                onClick={() => setActiveTab('ALL')}
                className={cn(
                  'flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  activeTab === 'ALL'
                    ? 'bg-main-primary text-white'
                    : 'bg-transparent text-main-black/70 hover:bg-purple-98'
                )}
              >
                {t('tabs.all')}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-purple-92 text-main-black'
                  )}
                >
                  {listingCounts.all}
                </span>
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('RENT' as ListingType)}
                className={cn(
                  'flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  activeTab === 'RENT'
                    ? 'bg-main-primary text-white'
                    : 'bg-transparent text-main-black/70 hover:bg-purple-98'
                )}
              >
                {t('tabs.forRent')}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    activeTab === 'RENT' ? 'bg-white/20 text-white' : 'bg-purple-92 text-main-black'
                  )}
                >
                  {listingCounts.rent}
                </span>
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('SALE' as ListingType)}
                className={cn(
                  'flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  activeTab === 'SALE'
                    ? 'bg-main-primary text-white'
                    : 'bg-transparent text-main-black/70 hover:bg-purple-98'
                )}
              >
                {t('tabs.forSale')}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-bold',
                    activeTab === 'SALE' ? 'bg-white/20 text-white' : 'bg-purple-92 text-main-black'
                  )}
                >
                  {listingCounts.sale}
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className='border-b border-purple-92/50 p-6'>
            <div className='relative'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                <Search className='h-5 w-5 text-main-secondary/50' strokeWidth={2} />
              </div>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className='h-14 w-full rounded-lg border-2 border-purple-92 bg-purple-98 pl-12 pr-4 text-base font-medium text-main-black placeholder:text-main-secondary/50 focus:border-main-primary focus:outline-none focus:ring-0'
              />
            </div>
          </div>

          {/* Properties List */}
          <div className='flex-1 overflow-y-auto'>
            {filteredListings.length === 0 ? (
              <div className='flex items-center justify-center p-8'>
                <p className='text-sm text-main-secondary/60'>{t('empty.noProperties')}</p>
              </div>
            ) : (
              <div className='divide-y divide-purple-92/50'>
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.listing_id}
                    listing={listing}
                    isSelected={listing.listing_id === selectedListingId}
                    onClick={() => setSelectedListingId(listing.listing_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right Content - Property Detail */}
      <main className='flex-1 overflow-y-auto bg-purple-98'>
        {listingDetail && !isDetailLoading ? (
          <ListingDetailPanel listing={listingDetail} />
        ) : (
          <div className='flex h-full items-center justify-center'>
            {isDetailLoading ? (
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-98 border-t-main-primary' />
            ) : (
              <p className='text-sm text-main-secondary/60'>{t('empty.selectProperty')}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

