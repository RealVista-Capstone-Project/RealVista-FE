'use client';

import { APIProvider, Map } from '@vis.gl/react-google-maps';

interface GoogleMapProps {
  apiKey?: string;
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;
  className?: string;
}

const defaultMapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '15px',
};

const defaultCenter = {
  lat: 21.0285, // Hanoi
  lng: 105.8542,
};

const defaultZoom = 13;

export function GoogleMap({
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  defaultCenter: center = defaultCenter,
  defaultZoom: zoom = defaultZoom,
  className,
}: GoogleMapProps) {
  if (!apiKey) {
    return (
      <div className='flex h-full w-full items-center justify-center rounded-xl bg-gray-100 p-4 text-center text-gray-500'>
        <p>
          Google Maps API Key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env
          file.
        </p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: '100%', width: '100%' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          style={defaultMapContainerStyle}
          defaultCenter={center}
          defaultZoom={zoom}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
        />
      </APIProvider>
    </div>
  );
}
