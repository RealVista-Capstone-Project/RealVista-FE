'use client';

import { MAP_CONFIG } from '@/shared/config/maps';
import { cn } from '@/shared/lib/utils/cn';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

interface GoogleMapProps {
  apiKey?: string;
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;
  className?: string;
}

const MapErrorFallback = ({ message }: { message: string }) => (
  <div className='flex h-full w-full items-center justify-center rounded-xl bg-gray-100 p-4 text-center text-gray-500'>
    <p>{message}</p>
  </div>
);

export function GoogleMap({
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  defaultCenter: center = MAP_CONFIG.DEFAULT_CENTER.HANOI,
  defaultZoom: zoom = MAP_CONFIG.DEFAULT_ZOOM,
  className,
}: GoogleMapProps) {
  if (!apiKey) {
    return (
      <MapErrorFallback message='Google Maps API Key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.' />
    );
  }

  // Validate zoom level (0-21)
  const validZoom = Math.max(0, Math.min(21, zoom));

  // Validate coordinates
  const validCenter = {
    lat: Math.max(-90, Math.min(90, center.lat)),
    lng: Math.max(-180, Math.min(180, center.lng)),
  };

  return (
    <div className={cn('h-full w-full relative', className)}>
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100%', height: '100%', borderRadius: MAP_CONFIG.BORDER_RADIUS }}
          defaultCenter={validCenter}
          defaultZoom={validZoom}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
        />
      </APIProvider>
    </div>
  );
}
