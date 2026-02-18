'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MapPin, DollarSign, Search, SlidersHorizontal } from 'lucide-react';
import { RealVistaListingCard } from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { AdvancedSearchFilters } from '@/shared/ui/advanced-search-filters/advanced-search-filters';
import { Pagination } from '@/shared/ui/realvista-pagination';
import { Button } from '@/shared/ui/button/button';
import { SearchAPI } from '@/shared/api/search.api';
import { AdvancedSearchRequest, ListingSearchResponse } from '@/shared/types/search';
import { useRouter, useSearchParams } from 'next/navigation';
import { PropertyMapBasedSearchPage } from '@/screens/property-map-based-search/ui/property-map-based-search-page';

function RentPageContent() {
  const t = useTranslations('Rent');
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [isMapView, setIsMapView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<ListingSearchResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const itemsPerPage = 9;

  // Initialize state from URL params
  const [location, setLocation] = useState(searchParams?.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams?.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams?.get('maxPrice') || '');

  // Construct initial criteria from URL
  const getInitialCriteria = (): AdvancedSearchRequest => {
    // Rebuild dynamicAttributes from URL params (attr_BEDROOMS, attr_BATHROOMS, etc.)
    const dynamicAttributes: Record<string, string> = {};
    searchParams?.forEach((value, key) => {
      if (key.startsWith('attr_')) {
        const attrKey = key.slice(5).toUpperCase();
        dynamicAttributes[attrKey] = value;
      }
    });

    return {
      listingType: 'RENT' as const,
      location: searchParams?.get('location') || undefined,
      price:
        searchParams?.get('minPrice') || searchParams?.get('maxPrice')
          ? [
              searchParams?.get('minPrice') ? Number(searchParams?.get('minPrice')) : null,
              searchParams?.get('maxPrice') ? Number(searchParams?.get('maxPrice')) : null,
            ]
          : undefined,
      propertyType: searchParams?.get('propertyType') || undefined,
      propertyCategory: searchParams?.get('propertyCategory') || undefined,
      dynamicAttributes: Object.keys(dynamicAttributes).length > 0 ? dynamicAttributes : undefined,
      area: (searchParams?.get('minArea') || searchParams?.get('maxArea')) ? [
        searchParams?.get('minArea') ? Number(searchParams?.get('minArea')) : null,
        searchParams?.get('maxArea') ? Number(searchParams?.get('maxArea')) : null
      ] : undefined,
      hasVideo: searchParams?.get('hasVideo') === 'true',
      has3D: searchParams?.get('has3D') === 'true',
      sortBy: (searchParams?.get('sortBy') as any) || 'PRIORITY',
    };
  };

  const [searchCriteria, setSearchCriteria] = useState<AdvancedSearchRequest>(getInitialCriteria());

  // Effect to handle URL changes
  useEffect(() => {
    const page = Number(searchParams?.get('page')) || 1;
    setCurrentPage(page);

    // Update local state to match URL
    setLocation(searchParams?.get('location') || '');
    setMinPrice(searchParams?.get('minPrice') || '');
    setMaxPrice(searchParams?.get('maxPrice') || '');

    const criteria = getInitialCriteria();
    setSearchCriteria(criteria);

    performSearch(criteria, page);
  }, [searchParams]);

  const performSearch = async (criteria: AdvancedSearchRequest, page: number) => {
    setIsLoading(true);
    try {
      const response = await SearchAPI.searchListings(criteria, page - 1, itemsPerPage);
      setListings(response.content);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Search failed:', error);
      setListings([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUrl = (criteria: AdvancedSearchRequest, page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());

    if (criteria.location) params.set('location', criteria.location);
    if (criteria.price && criteria.price[0] !== null)
      params.set('minPrice', criteria.price[0]!.toString());
    if (criteria.price && criteria.price[1] !== null)
      params.set('maxPrice', criteria.price[1]!.toString());

    // Advanced Filters
    if (criteria.propertyType) params.set('propertyType', criteria.propertyType.toString());
    if (criteria.propertyCategory) params.set('propertyCategory', criteria.propertyCategory.toString());
    if (criteria.area && criteria.area[0] !== null) params.set('minArea', criteria.area[0]!.toString());
    if (criteria.area && criteria.area[1] !== null) params.set('maxArea', criteria.area[1]!.toString());
    if (criteria.hasVideo) params.set('hasVideo', 'true');
    if (criteria.has3D) params.set('has3D', 'true');
    if (criteria.sortBy && criteria.sortBy !== 'PRIORITY') params.set('sortBy', criteria.sortBy);

    // Serialize dynamicAttributes as attr_KEY=value in URL
    if (criteria.dynamicAttributes) {
      Object.entries(criteria.dynamicAttributes).forEach(([key, value]) => {
        if (value) params.set(`attr_${key.toLowerCase()}`, value);
      });
    }

    router.push(`/${locale}/rent?${params.toString()}`);
  };

  const handleBasicSearch = () => {
    const updatedCriteria: AdvancedSearchRequest = {
      ...searchCriteria,
      listingType: 'RENT' as const,
      location: location || undefined,
      price:
        minPrice || maxPrice
          ? [minPrice ? Number(minPrice) : null, maxPrice ? Number(maxPrice) : null]
          : undefined,
    };

    updateUrl(updatedCriteria, 1);
  };

  const handleAdvancedFiltersApply = (filters: Partial<AdvancedSearchRequest>) => {
    const updatedCriteria = {
      ...searchCriteria,
      ...filters,
      listingType: 'RENT' as const,
    };
    updateUrl(updatedCriteria, 1);
  };

  const handlePageChange = (page: number) => {
    updateUrl(searchCriteria, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isMapView) {
    return (
      <div className='h-screen w-full bg-white'>
        <PropertyMapBasedSearchPage initialListingType='RENT' onBack={() => setIsMapView(false)} />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-purple-98'>
      {/* Hero Section with Search */}
      <section className='px-6 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-16 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {/* Header */}
          <div className='mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center sm:gap-6'>
            <h1 className='text-2xl font-bold leading-[1.2] tracking-[-0.4px] text-main-black sm:text-3xl lg:text-[40px] sm:leading-[1.4]'>
              {t('searchTitle')}
            </h1>

            {/* Search Option Toggle */}
            <div className='w-full sm:w-auto'>
              <Button
                type='button'
                onClick={() => setIsMapView(!isMapView)}
                className='flex w-full items-center justify-between gap-3 rounded-lg border-[1.5px] border-purple-92 bg-white px-4 py-3 text-base font-medium text-main-secondary opacity-70 transition-all hover:opacity-100 sm:w-auto cursor-pointer'
                variant='outline'
              >
                <span>{isMapView ? t('searchWithSearchBar') : t('searchWithMap')}</span>
                <div className='relative flex h-5 w-5 items-center justify-center'>
                  <div className='absolute inset-0 rounded-full bg-purple-96'></div>
                  <MapPin className='relative h-3 w-3 text-main-primary' strokeWidth={2.5} />
                </div>
              </Button>
            </div>
          </div>

          {/* Simple Search Bar */}
          <div className='bg-white rounded-lg border border-purple-92 p-6 mb-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {/* Location */}
              <div>
                <label className='flex items-center gap-2 text-sm font-medium text-main-black mb-2'>
                  <MapPin className='w-4 h-4 text-main-primary' />
                  Địa điểm
                </label>
                <input
                  type='text'
                  placeholder='Hà Nội, Việt Nam'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBasicSearch()}
                  className='w-full px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
                />
              </div>

              {/* Min Price */}
              <div>
                <label className='flex items-center gap-2 text-sm font-medium text-main-black mb-2'>
                  <DollarSign className='w-4 h-4 text-main-primary' />
                  Giá tối thiểu
                </label>
                <input
                  type='number'
                  placeholder='5,000,000 VNĐ'
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBasicSearch()}
                  className='w-full px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
                />
              </div>

              {/* Max Price */}
              <div>
                <label className='flex items-center gap-2 text-sm font-medium text-main-black mb-2'>
                  <DollarSign className='w-4 h-4 text-main-primary' />
                  Giá tối đa
                </label>
                <input
                  type='number'
                  placeholder='25,000,000 VNĐ'
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBasicSearch()}
                  className='w-full px-4 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-primary'
                />
              </div>

              {/* Search Button & Filters */}
              <div className='flex items-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsFiltersOpen(true)}
                  className='border-main-primary text-main-primary hover:bg-purple-96 px-4 py-2 flex items-center justify-center gap-2'
                  title='Bộ lọc nâng cao'
                >
                  <SlidersHorizontal className='w-4 h-4' />
                </Button>
                <Button
                  type='button'
                  onClick={handleBasicSearch}
                  className='flex-1 bg-main-primary hover:bg-main-primary/90 text-white px-6 py-2 flex items-center justify-center gap-2'
                >
                  <Search className='w-4 h-4' />
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Search Filters Side Sheet */}
          <AdvancedSearchFilters
            open={isFiltersOpen}
            onOpenChange={setIsFiltersOpen}
            onApplyFilters={handleAdvancedFiltersApply}
            initialFilters={searchCriteria}
          />
        </div>
      </section>

      {/* Results Section */}
      <section className='px-6 pb-12 pt-8 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-lg text-main-secondary'>Loading...</div>
            </div>
          ) : (
            <>
              {/* Property Grid */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {listings.map((listing, index) => (
                  <RealVistaListingCard
                    key={listing.listing_id || index}
                    id={listing.listing_id}
                    title={listing.name}
                    price={listing.price || 0}
                    image={
                      listing.thumbnail ||
                      'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'
                    }
                    address={listing.location || 'Unknown'}
                    beds={listing.bedrooms || 0}
                    bathrooms={listing.bathrooms || 0}
                    area={listing.area || 0}
                    isFavorite={false}
                    onToggleFavorite={(id: string) => {}}
                    onClick={(id: string) => {}}
                  />
                ))}
              </div>

              {/* No Results */}
              {listings.length === 0 && (
                <div className='py-12 text-center'>
                  <p className='text-lg text-main-secondary'>
                    No properties found. Try adjusting your search criteria.
                  </p>
                </div>
              )}

              {/* Pagination */}
              {listings.length > 0 && (
                <div className='mt-12'>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export function RentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RentPageContent />
    </Suspense>
  );
}

export default RentPage;
