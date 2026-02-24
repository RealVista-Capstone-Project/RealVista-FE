'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PropertyHeader } from '@/features/property-header';
import { PropertyGallery } from '@/features/property-gallery';
import { PriceAndTour } from '@/features/price-and-tour';
import { PropertyAbout } from '@/features/property-about';
import { MonthlyCostBreakdown } from '@/features/monthly-cost-breakdown';
import type { Property } from '@/entities/property';
import type { Listing } from '@/entities/listing';
import { mapListingToProperty } from '@/entities/listing/lib/listing-to-property.mapper';
import { bookmarkApi } from '@/entities/bookmark/api/bookmark.api';
import { getAuthToken } from '@/shared/lib/auth/get-auth-token';
import { useAuthSession } from '@/features/auth/model';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { SimilarListings } from '@/widgets/similar-listings';
import { LoginRequiredModal } from '@/shared/ui/login-required-modal/login-required-modal';

export interface ListingDetailScreenProps {
  listing: Listing;
}

export function ListingDetailScreen({ listing }: ListingDetailScreenProps) {
  // Map Listing to Property for compatibility with existing components
  const property: Property = mapListingToProperty(listing);

  const [isFavorite, setIsFavorite] = useState<boolean>(listing.is_favorite ?? false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: session } = useAuthSession();

  // The listing is fetched server-side (no auth token) so is_favorite is always false
  // from SSR. Re-fetch on client mount using async getAuthToken() to get a fresh token
  // (getAuthTokenSync() may be null on first mount since AuthTokenProvider hasn't run yet).
  useEffect(() => {
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) return; // Not logged in, keep isFavorite = false
        const apiUrl = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:8080/api/v1';
        const res = await fetch(`${apiUrl}/listings/${listing.listing_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.data?.is_favorite !== undefined) {
          setIsFavorite(data.data.is_favorite);
        }
      } catch {
        /* ignore – user may be unauthenticated */
      }
    })();
  }, [listing.listing_id]);

  const { mutate: toggleFavorite } = useMutation({
    mutationFn: () => bookmarkApi.toggleBookmark(listing.listing_id),
    onSuccess: () => {
      setIsFavorite((prev) => !prev);
    },
  });

  const handleFavorite = () => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    toggleFavorite();
  };

  const handleBrowseNearby = () => {
    // Browse nearby listings
    console.log('Browse nearby');
  };

  const handleViewAllPhotos = () => {
    // Open photo gallery
    console.log('View all photos');
  };

  const handle3DTour = () => {
    // Open 3D tour
    console.log('Open 3D tour');
  };

  const handleVideo = () => {
    // Play video
    console.log('Play video');
  };

  const handleContact = () => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    // Contact agent
    console.log('Contact agent');
  };

  const handleRequestTour = (date: string) => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    // Request tour with date
    console.log('Request tour for:', date);
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(property.price);

  return (
    <div className='min-h-screen bg-background pb-[88px] md:pb-8'>
      <div className='max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-8'>
        <PropertyHeader
          property={property}
          onFavorite={handleFavorite}
          isFavorite={isFavorite}
          onBrowseNearby={handleBrowseNearby}
        />

        {/* Gallery Section */}
        <div className='mt-4 sm:mt-8'>
          <PropertyGallery
            images={property.images}
            onViewAllPhotos={handleViewAllPhotos}
            on3DTour={handle3DTour}
            onVideo={handleVideo}
            onFavorite={handleFavorite}
            isFavorite={isFavorite}
          />
        </div>

        {/* Responsive layout: mobile column, desktop row */}
        <div className='mt-6 sm:mt-10 flex flex-col md:flex-row md:gap-10'>
          {/* Main Content */}
          <div className='flex-1 min-w-0'>
            {/* Mobile: Price & Tour Section (shown inline) */}
            <div className='md:hidden mb-6'>
              <PriceAndTour
                price={property.price}
                listingType={listing.listing_type}
                onContact={handleContact}
                onRequestTour={handleRequestTour}
              />
            </div>

            {/* About Section */}
            <div className='mb-6'>
              <PropertyAbout property={property} />
            </div>

            {/* Monthly Cost Breakdown Section */}
            {property.costBreakdown && (
              <MonthlyCostBreakdown costBreakdown={property.costBreakdown} />
            )}
          </div>

          {/* Desktop: Price & Tour Sidebar */}
          <div className='hidden md:block mt-6 md:mt-0 w-full max-w-[380px] shrink-0'>
            <div className='md:sticky md:top-8'>
              <PriceAndTour
                price={property.price}
                listingType={listing.listing_type}
                onContact={handleContact}
                onRequestTour={handleRequestTour}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Similar Listings Section - Full Width */}
      <div className='mt-12 sm:mt-16'>
        <SimilarListings propertyId={property.id} />
      </div>

      {/* Mobile Sticky Footer */}
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-purple-92 px-4 py-3 sm:px-6 md:hidden z-50'>
        <div className='max-w-[1200px] mx-auto flex flex-col xs:flex-row items-center justify-between gap-3 xs:gap-4'>
          <div className='w-full xs:w-auto mb-2 xs:mb-0'>
            <p className='text-main-black/50 text-xs font-medium leading-[1.4]'>
              {listing.listing_type === 'RENT' ? 'Rent price' : 'Sale price'}
            </p>
            <div className='flex items-baseline gap-1'>
              <p className='text-main-primary text-xl font-extrabold leading-[1.5] tracking-tight'>
                {formattedPrice}
              </p>
              {listing.listing_type === 'RENT' && (
                <span className='text-main-black/50 text-sm font-medium'>/month</span>
              )}
            </div>
          </div>
          <RealVistaButton
            variant='primary'
            size='medium'
            className='w-full xs:w-auto max-w-[200px]'
            onClick={handleContact}
          >
            Apply Now
          </RealVistaButton>
        </div>
      </div>
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
