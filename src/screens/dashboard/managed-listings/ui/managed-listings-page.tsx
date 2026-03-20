'use client';

import * as React from 'react';
import { Search, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ListingCard } from './components/listing-card';
import { listingQueries } from '@/entities/listing/api';
import { ListingDetailPanel } from './components/listing-detail-panel';
import type { Listing } from '@/entities/listing';
import type { ListingType } from '../types/managed-listing';
import { cn } from '@/shared/lib/utils';

type TabType = ListingType | 'ALL';

/**
 * Managed Listings Page
 *
 * Displays a list of properties managed by the current user.
 * Features:
 * - Property list with status badges
 * - Tabs to filter by listing type (All, Rent, Sale)
 * - Search functionality
 * - Detailed property view
 * - Tenant information
 * - Room availability tracking
 */
export function ManagedListingsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedListingId, setSelectedListingId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>('ALL');

  const { data: listings, isLoading, error } = useQuery(listingQueries.managed());

  // Use centralized listing query
  const { data: listingResponse, isLoading: isDetailLoading } = useQuery({
    ...listingQueries.detail(selectedListingId || ''),
    enabled: !!selectedListingId,
  });

  // Extract listing detail from response
  const listingDetail = listingResponse?.payload.data as Listing | undefined;

  // Filter listings based on tab and search query
  const filteredListings = React.useMemo(() => {
    if (!listings) return [];

    // Filter by tab
    let tabFiltered = listings;
    if (activeTab !== 'ALL') {
      tabFiltered = listings.filter((listing) => listing.listing_type === activeTab);
    }

    // Filter by search query
    if (!searchQuery.trim()) return tabFiltered;

    const query = searchQuery.toLowerCase();
    return tabFiltered.filter((listing) => {
      const address = listing.full_address?.toLowerCase() || '';
      return listing.name.toLowerCase().includes(query) || address.includes(query);
    });
  }, [listings, activeTab, searchQuery]);

  // Count listings by type
  const listingCounts = React.useMemo(() => {
    if (!listings) return { all: 0, rent: 0, sale: 0 };
    return {
      all: listings.length,
      rent: listings.filter((l) => l.listing_type === 'RENT').length,
      sale: listings.filter((l) => l.listing_type === 'SALE').length,
    };
  }, [listings]);

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
          <p className='text-lg font-semibold text-main-black'>Failed to load listings</p>
          <p className='mt-2 text-sm text-main-secondary/60'>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-96px)] overflow-hidden'>
      {/* Left Sidebar - Properties List */}
      <aside className='w-[460px] border-r border-purple-92/50 bg-white'>
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-b border-purple-92/50 p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h2 className='text-xl font-bold text-main-black'>Properties</h2>
                <div className='flex items-center justify-center rounded-lg bg-main-primary px-2 py-1'>
                  <span className='text-sm font-bold text-white'>{filteredListings.length}</span>
                </div>
              </div>
              <button
                type='button'
                className='flex size-6 items-center justify-center text-main-black transition-colors hover:text-main-primary'
                aria-label='Filter'
              >
                <Filter className='h-5 w-5' strokeWidth={2} />
              </button>
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
                All
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
                For Rent
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
                For Sale
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
                placeholder='Search...'
                className='h-14 w-full rounded-lg border-2 border-purple-92 bg-purple-98 pl-12 pr-4 text-base font-medium text-main-black placeholder:text-main-secondary/50 focus:border-main-primary focus:outline-none focus:ring-0'
              />
            </div>
          </div>

          {/* Properties List */}
          <div className='flex-1 overflow-y-auto'>
            {filteredListings.length === 0 ? (
              <div className='flex items-center justify-center p-8'>
                <p className='text-sm text-main-secondary/60'>No properties found</p>
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
              <p className='text-sm text-main-secondary/60'>Select a property to view details</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
