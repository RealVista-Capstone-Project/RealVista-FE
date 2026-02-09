'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MAP_CONFIG } from '@/shared/config/maps';
import { cn } from '@/shared/lib/utils';
import { PropertyMapMarker } from '@/shared/ui/property-map-marker';

export interface PropertyLocation {
  id: string;
  lat: number;
  lng: number;
  price: number;
  currency?: string;
}

interface PropertyMapProps {
  properties: PropertyLocation[];
  selectedPropertyId?: string;
  hoveredPropertyId?: string;
  onPropertyClick?: (propertyId: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  apiKey?: string;
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;
  className?: string;
}

type MapType = 'roadmap' | 'satellite';

const MapErrorFallback = ({ message }: { message: string }) => (
  <div className='flex h-full w-full items-center justify-center rounded-xl bg-gray-100 p-4 text-center text-gray-500'>
    <p>{message}</p>
  </div>
);

export function PropertyMap({
  properties,
  selectedPropertyId,
  hoveredPropertyId,
  onPropertyClick,
  onBoundsChange,
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  defaultCenter,
  defaultZoom = MAP_CONFIG.DEFAULT_ZOOM,
  className,
}: PropertyMapProps) {
  const [mapType, setMapType] = useState<MapType>('roadmap');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  if (!apiKey) {
    return (
      <MapErrorFallback message='Google Maps API Key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.' />
    );
  }

  // Calculate center from properties if not provided
  const center =
    defaultCenter ||
    (properties.length > 0
      ? {
          lat: properties.reduce((sum, p) => sum + p.lat, 0) / properties.length,
          lng: properties.reduce((sum, p) => sum + p.lng, 0) / properties.length,
        }
      : MAP_CONFIG.DEFAULT_CENTER.HANOI);

  return (
    <div className={cn('relative h-full w-full', className)}>
      <APIProvider apiKey={apiKey} onLoad={() => console.log('Maps API loaded')}>
        <Map
          style={{ width: '100%', height: '100%', borderRadius: MAP_CONFIG.BORDER_RADIUS }}
          defaultCenter={center}
          defaultZoom={defaultZoom}
          mapTypeId={mapType}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId='property-search-map'
          onCenterChanged={(ev) => setMap(ev.map)}
          onZoomChanged={(ev) => setMap(ev.map)}
          onIdle={() => {
            if (map && onBoundsChange) {
              const bounds = map.getBounds();
              if (bounds) {
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                onBoundsChange({
                  north: ne.lat(),
                  south: sw.lat(),
                  east: ne.lng(),
                  west: sw.lng(),
                });
              }
            }
          }}
        >
          {/* Render property markers */}
          {properties.map((property) => (
            <AdvancedMarker
              key={property.id}
              position={{ lat: property.lat, lng: property.lng }}
              onClick={() => onPropertyClick?.(property.id)}
            >
              <PropertyMapMarker
                price={property.price}
                currency={property.currency}
                isSelected={selectedPropertyId === property.id}
                isHovered={hoveredPropertyId === property.id}
                onClick={() => onPropertyClick?.(property.id)}
              />
            </AdvancedMarker>
          ))}
        </Map>

        {/* Map/Satellite Toggle */}
        <div className='absolute left-4 top-4 z-10 flex gap-2'>
          <button
            type='button'
            onClick={() => setMapType('roadmap')}
            className={cn(
              'rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-md transition-all',
              mapType === 'roadmap'
                ? 'bg-main-primary text-white'
                : 'text-main-black hover:bg-purple-98'
            )}
          >
            Map
          </button>
          <button
            type='button'
            onClick={() => setMapType('satellite')}
            className={cn(
              'rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-md transition-all',
              mapType === 'satellite'
                ? 'bg-main-primary text-white'
                : 'text-main-black hover:bg-purple-98'
            )}
          >
            Satellite
          </button>
        </div>
      </APIProvider>
    </div>
  );
}
