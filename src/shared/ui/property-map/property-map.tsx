'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { Map as MapIcon, Satellite, ChevronDown } from 'lucide-react';
import { MAP_CONFIG } from '@/shared/config/maps';
import { cn } from '@/shared/lib/utils';
import { PropertyMapMarker } from '@/shared/ui/property-map-marker';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

export interface PropertyLocation {
  id: string; // This will be the ID of the first property in the group
  ids?: string[]; // IDs of all properties in this group
  lat: number;
  lng: number;
  price: number;
  currency?: string;
  label?: string;
  isBoosted?: boolean;
}

interface PropertyMapProps {
  properties: PropertyLocation[];
  selectedPropertyIds?: string[];
  hoveredPropertyIds?: string[];
  onPropertyClick?: (propertyIds: string[]) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  apiKey?: string;
  defaultCenter?: { lat: number; lng: number };
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
  selectedPropertyIds,
  hoveredPropertyIds,
  onPropertyClick,
  onBoundsChange,
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  defaultCenter,
  defaultZoom = MAP_CONFIG.DEFAULT_ZOOM,
  className,
}: PropertyMapProps) {
  const t = useTranslations('PropertyMap');
  const [mapType, setMapType] = useState<MapType>('roadmap');

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
      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100%', height: '100%', borderRadius: MAP_CONFIG.BORDER_RADIUS }}
          defaultCenter={center}
          defaultZoom={defaultZoom}
          mapTypeId={mapType}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId='property-search-map'
          onIdle={(ev) => {
            if (ev.map && onBoundsChange) {
              const bounds = ev.map.getBounds();
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
              onClick={() => onPropertyClick?.(property.ids || [property.id])}
            >
              <PropertyMapMarker
                price={property.price}
                label={property.label}
                isSelected={
                  selectedPropertyIds
                    ? (property.ids || [property.id]).some((id) => selectedPropertyIds.includes(id))
                    : false
                }
                isHovered={
                  hoveredPropertyIds
                    ? (property.ids || [property.id]).some((id) => hoveredPropertyIds.includes(id))
                    : false
                }
                isBoosted={property.isBoosted}
                onClick={() => onPropertyClick?.(property.ids || [property.id])}
              />
            </AdvancedMarker>
          ))}
        </Map>

        {/* Map/Satellite Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type='button'
              className='absolute left-6 lg:left-8 top-4 z-10 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1.5 shadow-lg backdrop-blur-md border border-white/50 text-xs font-medium text-gray-700 hover:bg-white transition-all duration-200'
            >
              {mapType === 'roadmap' ? (
                <MapIcon className='h-4 w-4' />
              ) : (
                <Satellite className='h-4 w-4' />
              )}
              <span className="capitalize">{mapType === 'roadmap' ? t('map') : t('satellite')}</span>
              <ChevronDown className='h-3.5 w-3.5 text-gray-500' />
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-40 p-1.5 bg-white/95 backdrop-blur-md border border-white/50 shadow-lg rounded-xl' align='start'>
            <button
              type='button'
              onClick={() => setMapType('roadmap')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                mapType === 'roadmap'
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <MapIcon className='h-4 w-4' />
              <span>{t('map')}</span>
            </button>
            <button
              type='button'
              onClick={() => setMapType('satellite')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                mapType === 'satellite'
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Satellite className='h-4 w-4' />
              <span>{t('satellite')}</span>
            </button>
          </PopoverContent>
        </Popover>
      </APIProvider>
    </div>
  );
}
