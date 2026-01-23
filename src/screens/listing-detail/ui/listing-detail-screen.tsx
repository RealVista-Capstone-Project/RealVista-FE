'use client';

import { PropertyHeader } from '@/features/property-header';
import { PropertyGallery } from '@/features/property-gallery';
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

        <div className='mt-8'>
          <PropertyGallery
            images={property.images}
            onViewAllPhotos={handleViewAllPhotos}
            on3DTour={handle3DTour}
            onVideo={handleVideo}
          />
        </div>
      </div>
    </div>
  );
}
