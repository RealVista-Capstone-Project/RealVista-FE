'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { PropertyForm } from '@/features/property-management';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function PropertyCreatePage() {
  return (
    <div className='container py-8 max-w-6xl mx-auto'>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <PropertyForm />
      </APIProvider>
    </div>
  );
}
