import { Suspense } from 'react';
import { PropertyMapBasedSearchPage } from '@/screens/property-map-based-search/ui/property-map-based-search-page';

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <PropertyMapBasedSearchPage initialListingType='SALE' />
    </Suspense>
  );
}
