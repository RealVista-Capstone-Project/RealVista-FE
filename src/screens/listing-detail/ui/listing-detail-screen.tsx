'use client';

import { PropertyHeader } from '@/features/property-header';
import { PropertyGallery } from '@/features/property-gallery';
import { PriceAndTour } from '@/features/price-and-tour';
import { PropertyAbout } from '@/features/property-about';
import type { Property } from '@/entities/property';

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

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-[1200px] mx-auto px-6 py-8'>
        <PropertyHeader
          property={property}
          onBack={handleBack}
          onShare={handleShare}
          onFavorite={handleFavorite}
          isFavorite={false}
          onBrowseNearby={handleBrowseNearby}
        />

        {/* Gallery Section */}
        <div className='mt-8'>
          <PropertyGallery
            images={property.images}
            onViewAllPhotos={handleViewAllPhotos}
            on3DTour={handle3DTour}
            onVideo={handleVideo}
          />
        </div>

        <div className='mt-10 md:flex md:gap-10'>
          {/* About Section */}
          <div className='mt-12'>
            <PropertyAbout property={property} />
          </div>
          {/* Price & Tour Section */}
          <div className='mt-6 max-w-[380px]'>
            <PriceAndTour
              price={property.price}
              onContact={handleContact}
              onRequestTour={handleRequestTour}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
