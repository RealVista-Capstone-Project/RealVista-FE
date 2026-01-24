'use client';

import { PropertyHeader } from '@/features/property-header';
import { PropertyGallery } from '@/features/property-gallery';
import { PriceAndTour } from '@/features/price-and-tour';
import { PropertyAbout } from '@/features/property-about';
import type { Property } from '@/entities/property';
import { RealVistaButton } from '@/shared/ui/realvista-button';

export interface ListingDetailScreenProps {
  property: Property;
}

export function ListingDetailScreen({ property }: ListingDetailScreenProps) {
  const handleBack = () => {
    // Navigate back to map
    console.log('Back to map');
  };

  const handleShare = () => {
    // Share property
    console.log('Share property');
  };

  const handleFavorite = () => {
    // Toggle favorite
    console.log('Toggle favorite');
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
    // Contact agent
    console.log('Contact agent');
  };

  const handleRequestTour = (date: string) => {
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
    <div className='min-h-screen bg-background pb-24 md:pb-8'>
      <div className='max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-8'>
        <PropertyHeader
          property={property}
          onBack={handleBack}
          onShare={handleShare}
          onFavorite={handleFavorite}
          isFavorite={false}
          onBrowseNearby={handleBrowseNearby}
        />

        {/* Gallery Section */}
        <div className='mt-4 md:mt-8'>
          <PropertyGallery
            images={property.images}
            onViewAllPhotos={handleViewAllPhotos}
            on3DTour={handle3DTour}
            onVideo={handleVideo}
          />
        </div>

        {/* Mobile: Price & Tour inline, Desktop: Sidebar layout */}
        <div className='mt-6 md:mt-10 md:flex md:gap-10'>
          {/* Main Content */}
          <div className='flex-1'>
            {/* Mobile: Price & Tour Section (shown inline) */}
            <div className='md:hidden mb-6'>
              <PriceAndTour
                price={property.price}
                onContact={handleContact}
                onRequestTour={handleRequestTour}
              />
            </div>

            {/* About Section */}
            <PropertyAbout property={property} />
          </div>

          {/* Desktop: Price & Tour Sidebar */}
          <div className='hidden md:block mt-6 max-w-[380px] shrink-0'>
            <div className='md:sticky md:top-8'>
              <PriceAndTour
                price={property.price}
                onContact={handleContact}
                onRequestTour={handleRequestTour}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-purple-92 p-4 md:hidden z-50'>
        <div className='max-w-[1200px] mx-auto flex items-center justify-between gap-4'>
          <div>
            <p className='text-main-black/50 text-[12px] font-medium leading-[1.4]'>Rent price</p>
            <div className='flex items-baseline gap-0.5'>
              <p className='text-main-primary text-[20px] font-extrabold leading-[1.5] tracking-[-1px]'>
                {formattedPrice}
              </p>
              <span className='text-main-black/50 text-[14px] font-medium'>/month</span>
            </div>
          </div>
          <RealVistaButton
            variant='primary'
            size='medium'
            className='flex-1 max-w-[200px]'
            onClick={handleContact}
          >
            Apply Now
          </RealVistaButton>
        </div>
      </div>
    </div>
  );
}
