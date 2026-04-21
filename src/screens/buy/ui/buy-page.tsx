'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search } from 'lucide-react';
import {
  type ListingAttribute,
} from '@/shared/ui/realvista-listing-card/realvista-listing-card';
import { HorizontalListingCard } from '@/shared/ui/horizontal-listing-card';
import { SearchSidebarFilters } from '@/shared/ui/search-sidebar-filters';
import { Pagination } from '@/shared/ui/realvista-pagination';
import { Skeleton } from '@/shared/ui/skeleton/skeleton';
import { SearchAPI } from '@/shared/api/search.api';
import { AdvancedSearchRequest, ListingSearchResponse } from '@/shared/types/search';
import { useQueryClient } from '@tanstack/react-query';
import { bookmarkApi } from '@/entities/bookmark';
import { useRouter, useSearchParams } from 'next/navigation';
import { PropertyMapBasedSearchPage } from '@/screens/property-map-based-search/ui/property-map-based-search-page';
import { useHideFooter } from '@/widgets/layout';
import { useAuthSession } from '@/features/auth/model';
import { LoginRequiredModal } from '@/shared/ui/login-required-modal/login-required-modal';
import { behaviorTracker } from '@/shared/lib/analytics';
import { SaveSearchButton } from '@/features/save-search';
import { RecommendedListings } from '@/widgets/recommended-listings';
import { HeroSearchBanner } from '@/shared/ui/hero-search-banner/hero-search-banner';
import { GlobalProfileSwitcher } from '@/shared/ui/global-profile-switcher';
import { useDistricts } from '@/entities/location/api/use-locations';

function BuyPageContent() {
  const t = useTranslations('Buy');
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [isMapView, setIsMapView] = useState(false);
  useHideFooter(isMapView);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<ListingSearchResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: session } = useAuthSession();
  const queryClient = useQueryClient();
  const itemsPerPage = 9;

  const handleToggleFavorite = async (id: string) => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }

    // Optimistic update
    setListings((prev) =>
      prev.map((l) => (l.listing_id === id ? { ...l, is_favorite: !l.is_favorite } : l))
    );

    try {
      await bookmarkApi.toggleBookmark(id);
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch (error) {
      // Revert on error
      setListings((prev) =>
        prev.map((l) => (l.listing_id === id ? { ...l, is_favorite: !l.is_favorite } : l))
      );
      console.error('Failed to toggle bookmark:', error);
    }
  };

  // Initialize state from URL params
  const [location, setLocation] = useState(searchParams?.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams?.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams?.get('maxPrice') || '');
  const [propertyType, setPropertyType] = useState<string | undefined>(
    searchParams?.get('propertyType') || undefined
  );
  const [districtId, setDistrictId] = useState<string | undefined>(
    searchParams?.get('locationId') || undefined
  );

  const { data: districts = [] } = useDistricts();

  // Construct initial criteria from URL
  const getInitialCriteria = useCallback((): AdvancedSearchRequest => {
    // Rebuild dynamicAttributes from URL params (attr_BEDROOMS, attr_BATHROOMS, etc.)
    const dynamicAttributes: Record<string, string> = {};
    searchParams?.forEach((value, key) => {
      if (key.startsWith('attr_')) {
        const attrKey = key.slice(5).toUpperCase();
        dynamicAttributes[attrKey] = value;
      }
    });

    return {
      listingType: 'SALE' as const,
      location: searchParams?.get('location') || undefined,
      locationId: searchParams?.get('locationId') || undefined,
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
      area:
        searchParams?.get('minArea') || searchParams?.get('maxArea')
          ? [
            searchParams?.get('minArea') ? Number(searchParams?.get('minArea')) : null,
            searchParams?.get('maxArea') ? Number(searchParams?.get('maxArea')) : null,
          ]
          : undefined,
      hasVideo: searchParams?.get('hasVideo') === 'true',
      has3D: searchParams?.get('has3D') === 'true',
      sortBy: (searchParams?.get('sortBy') as AdvancedSearchRequest['sortBy']) || 'PRIORITY',
    };
  }, [searchParams]);

  const [searchCriteria, setSearchCriteria] = useState<AdvancedSearchRequest>(getInitialCriteria());

  const performSearch = useCallback(async (criteria: AdvancedSearchRequest, page: number) => {
    setIsLoading(true);
    try {
      const response = await SearchAPI.searchListings(criteria, page - 1, itemsPerPage);
      setListings(response?.content || []);
      setTotalPages(response?.total_pages || 1);
      setTotalResults(response?.total_elements || 0);
    } catch (error) {
      console.error('Failed to search properties:', error);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage]);

  // Effect to handle URL changes (e.g. back button)
  useEffect(() => {
    const page = Number(searchParams?.get('page')) || 1;
    setCurrentPage(page);

    // Update local state to match URL
    setLocation(searchParams?.get('location') || '');
    setMinPrice(searchParams?.get('minPrice') || '');
    setMaxPrice(searchParams?.get('maxPrice') || '');
    setPropertyType(searchParams?.get('propertyType') || undefined);
    setDistrictId(searchParams?.get('locationId') || undefined);

    const criteria = getInitialCriteria();
    setSearchCriteria(criteria);

    performSearch(criteria, page);
  }, [searchParams, getInitialCriteria, performSearch]);

  const updateUrl = useCallback((criteria: AdvancedSearchRequest, page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());

    if (criteria.location) params.set('location', criteria.location);
    if (criteria.locationId) params.set('locationId', criteria.locationId);
    if (criteria.price && criteria.price[0] !== null)
      params.set('minPrice', criteria.price[0].toString());
    if (criteria.price && criteria.price[1] !== null)
      params.set('maxPrice', criteria.price[1].toString());

    // Add all filter parameters
    if (criteria.propertyType) params.set('propertyType', criteria.propertyType.toString());
    if (criteria.propertyCategory)
      params.set('propertyCategory', criteria.propertyCategory.toString());
    if (criteria.area && criteria.area[0] !== null)
      params.set('minArea', criteria.area[0].toString());
    if (criteria.area && criteria.area[1] !== null)
      params.set('maxArea', criteria.area[1].toString());
    if (criteria.hasVideo) params.set('hasVideo', 'true');
    if (criteria.has3D) params.set('has3D', 'true');
    if (criteria.sortBy && criteria.sortBy !== 'PRIORITY') params.set('sortBy', criteria.sortBy);

    // Serialize dynamicAttributes as attr_KEY=value in URL
    if (criteria.dynamicAttributes) {
      Object.entries(criteria.dynamicAttributes).forEach(([key, value]) => {
        if (value) params.set(`attr_${key.toLowerCase()}`, value);
      });
    }

    const queryString = params.toString();
    const newUrl = `/${locale}/buy${queryString ? `?${queryString}` : ''}`;

    // Update URL without navigation to avoid full page reload
    window.history.replaceState(window.history.state, '', newUrl);

    // Update state and fetch directly
    setSearchCriteria(criteria);
    setCurrentPage(page);
    performSearch(criteria, page);
  }, [locale, performSearch]);

  const handleBasicSearch = () => {
    const updatedCriteria: AdvancedSearchRequest = {
      ...searchCriteria,
      listingType: 'SALE' as const,
      location: location || undefined,
      locationId: districtId || undefined,
      propertyType: propertyType || undefined,
      price:
        minPrice || maxPrice
          ? [minPrice ? Number(minPrice) : null, maxPrice ? Number(maxPrice) : null]
          : undefined,
    };

    // This will trigger the useEffect
    updateUrl(updatedCriteria, 1);

    const el = document.getElementById('search-results');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSidebarFiltersChange = (sidebarFilters: AdvancedSearchRequest) => {
    // Sync hero state with sidebar values
    setLocation(sidebarFilters.location || '');
    setPropertyType(sidebarFilters.propertyType || undefined);
    setMinPrice(sidebarFilters.price?.[0] ? String(sidebarFilters.price[0]) : '');
    setMaxPrice(sidebarFilters.price?.[1] ? String(sidebarFilters.price[1]) : '');
    setDistrictId(sidebarFilters.locationId || undefined);

    const updatedCriteria = {
      ...searchCriteria,
      locationId: sidebarFilters.locationId,
      location: sidebarFilters.location,
      propertyType: sidebarFilters.propertyType,
      price: sidebarFilters.price,
      area: sidebarFilters.area,
      dynamicAttributes: sidebarFilters.dynamicAttributes,
      hasVideo: sidebarFilters.hasVideo,
      has3D: sidebarFilters.has3D,
      sortBy: sidebarFilters.sortBy,
      listingType: 'SALE' as const,
    };
    updateUrl(updatedCriteria, 1);
  };

  const handlePageChange = (page: number) => {
    updateUrl(searchCriteria, page);
    // Scroll to results section, not top of page
    document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyType(undefined);
    setDistrictId(undefined);

    const defaultCriteria: AdvancedSearchRequest = {
      listingType: 'SALE' as const,
      sortBy: 'PRIORITY',
    };

    updateUrl(defaultCriteria, 1);
  };

  if (isMapView) {
    return (
      <div className='fixed inset-0 top-[4.5rem] w-full bg-white z-10'>
        <PropertyMapBasedSearchPage initialListingType='SALE' onBack={() => setIsMapView(false)} />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Hero Section with Search */}
      <HeroSearchBanner
        activeTab='buy'
        location={location}
        onLocationChange={setLocation}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        propertyType={propertyType}
        onPropertyTypeChange={setPropertyType}
        districtId={districtId}
        onDistrictChange={setDistrictId}
        districts={districts}
        onSearch={handleBasicSearch}
        onOpenFilters={() => {
          const el = document.getElementById('sidebar-filters');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onToggleMapView={() => setIsMapView(!isMapView)}
        isMapView={isMapView}
        secondaryActions={
          <>
            <GlobalProfileSwitcher searchType='BUY' />
            <SaveSearchButton searchType='BUY' criteria={searchCriteria} />
          </>
        }
      />

      {/* Recommended Listings */}
      <RecommendedListings sourcePage='buy' />

      {/* Results Section — Sidebar + Horizontal Cards */}
      <section id='search-results' className='px-6 pb-12 pt-8 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='mb-6'>
            <h2 className='text-xl font-bold text-foreground sm:text-2xl'>
              {t('resultsHeader')}
              {totalResults > 0 && (
                <span className='ml-2 text-base font-normal text-muted-foreground'>
                  ({totalResults})
                </span>
              )}
            </h2>
          </div>

          <div className='flex items-start gap-8'>
            {/* Sidebar Filters */}
            <aside id='sidebar-filters' className='w-72 shrink-0'>
              <div className='sticky top-20 rounded-xl border border-border bg-white p-4'>
                <SearchSidebarFilters
                  filters={searchCriteria}
                  onFiltersChange={handleSidebarFiltersChange}
                  onReset={handleResetFilters}
                  searchType='BUY'
                />
              </div>
            </aside>

            {/* Results */}
            <div className='flex-1 min-w-0'>
              {isLoading ? (
                <div className='space-y-4'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className='flex rounded-xl border border-border bg-white overflow-hidden'>
                      <Skeleton className='w-[260px] min-h-[180px] shrink-0' />
                      <div className='flex-1 p-4 space-y-3'>
                        <Skeleton className='h-6 w-1/3' />
                        <Skeleton className='h-5 w-2/3' />
                        <Skeleton className='h-4 w-1/2' />
                        <div className='flex gap-4 pt-2'>
                          <Skeleton className='h-4 w-16' />
                          <Skeleton className='h-4 w-16' />
                          <Skeleton className='h-4 w-16' />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {listings.length > 0 && (
                    <div className='space-y-4'>
                      {listings.map((listing, index) => (
                        <HorizontalListingCard
                          key={listing.listing_id || index}
                          listingType='SALE'
                          id={listing.listing_id}
                          title={listing.name}
                          price={listing.price || 0}
                          image={
                            listing.thumbnail ||
                            'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'
                          }
                          address={listing.full_address || 'Unknown'}
                          attributes={listing.attributes as ListingAttribute[]}
                          isFavorite={listing.is_favorite ?? false}
                          boostTags={listing.is_boosted ? listing.boost_packages : undefined}
                          userType={listing.user_type as 'AGENT' | 'OWNER'}
                          onToggleFavorite={handleToggleFavorite}
                          onClick={() => {
                            behaviorTracker.trackClick(listing.listing_id, {
                              listing_type: 'SALE',
                              price: listing.price,
                              source_page: 'buy',
                            });
                            router.push(`/${locale}/listing/${listing.slug || listing.listing_id}`);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {listings.length === 0 && (
                    <div className='py-16 text-center'>
                      <Search className='mx-auto h-12 w-12 text-primary/60 mb-4' />
                      <p className='text-lg font-medium text-foreground mb-2'>
                        {t('noResults')}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {t('noResultsHint')}
                      </p>
                    </div>
                  )}

                  {/* Pagination */}
                  {listings.length > 0 && (
                    <div className='mt-8'>
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
          </div>
        </div>
      </section>
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export function BuyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuyPageContent />
    </Suspense>
  );
}

export default BuyPage;
