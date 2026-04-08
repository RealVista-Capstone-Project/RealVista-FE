import { Suspense } from 'react';
import { PropertySearchPage } from '@/screens/property-map-based-search';

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <PropertySearchPage />
    </Suspense>
  );
}
