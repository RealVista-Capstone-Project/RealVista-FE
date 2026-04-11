'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RealVistaPropertyListingSearchBar } from '@/shared/ui/realvista-property-listing-search-bar/realvista-property-listing-search-bar';
import { AdvancedSearchFilters } from '@/shared/ui/advanced-search-filters/advanced-search-filters';
import { SearchAPI } from '@/shared/api/search.api';
import { AdvancedSearchRequest, ListingSearchResponse } from '@/shared/types/search';

export function SearchIntegrationExample() {
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<AdvancedSearchRequest>({
    listingType: 'SALE',
    sortBy: 'PRIORITY',
  });
  const [results, setResults] = useState<ListingSearchResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await SearchAPI.searchListings(searchCriteria, 0, 12);
      setResults(response?.content || []);
    } catch (error) {
      console.error('Search failed:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    try {
      // TODO: Get actual profile ID from auth context
      const profileId = 'user-profile-id';
      // Show success message
      // Show success message

    } catch (error) {
      console.error('Failed to save search:', error);
      // Handle error
    }
  };

  const handleApplyFilters = (filters: AdvancedSearchRequest) => {
    setSearchCriteria({ ...searchCriteria, ...filters });
    // Optionally trigger search immediately
    handleSearch();
  };

  const handleLocationChange = (location: string) => {
    setSearchCriteria({ ...searchCriteria, location });
  };

  return (
    <div className='w-full'>
      <RealVistaPropertyListingSearchBar
        location={searchCriteria.location || 'New York, USA'}
        onLocationChange={handleLocationChange}
        onSearch={handleSearch}
        onSaveSearch={handleSaveSearch}
        onAdvancedFilters={() => setShowFilters(true)}
        showSaveButton={true}
        showAdvancedFilters={true}
      />

      <AdvancedSearchFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        initialFilters={searchCriteria}
        onApplyFilters={handleApplyFilters}
      />

      {/* Results Display */}
      {loading && (
        <div className='mt-8 text-center'>
          <p>Loading results...</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className='mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {results.map((listing) => (
            <div
              key={listing.listing_id}
              className='border rounded-lg p-4 hover:shadow-lg transition-shadow'
            >
              <h3 className='font-bold text-lg'>{listing.name}</h3>
              <p className='text-grey-600'>{listing.full_address}</p>
              <p className='text-main-primary font-bold mt-2'>
                ${listing.price.toLocaleString()}
              </p>
              {listing.is_boosted && (
                <span className='inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded'>
                  {listing.boost_packages?.join(', ')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
