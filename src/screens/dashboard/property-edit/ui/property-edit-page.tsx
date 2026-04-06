'use client';

import { useMemo } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { PropertyForm, PropertyFormValues } from '@/features/property-management';
import { usePropertyDetail } from '@/entities/property/api/use-property-detail';
import { Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface Props {
  id: string;
}

export default function PropertyEditPage({ id }: Props) {
  const { data: property, isLoading, isError } = usePropertyDetail(id);

  const initialData = useMemo<Partial<PropertyFormValues> | undefined>(() => {
    if (!property) return undefined;

    return {
      info: {
        city: property.city_id || '',
        district: property.district_id || '',
        ward: property.location_id || '',
        streetAddress: property.street_address || '',
        location: {
          lat: property.latitude || 0,
          lng: property.longitude || 0,
        },
        landSize: property.land_size_m2 ? Number(property.land_size_m2) : 0,
        usableSize: property.usable_size_m2 ? Number(property.usable_size_m2) : 0,
        width: property.width_m ? Number(property.width_m) : 0,
        length: property.length_m ? Number(property.length_m) : 0,
        propertyType: property.property_type_code || '',
        amenityIds: property.amenities?.map((a) => a.amenity_id) || [],
        dynamicAttributes:
          property.attributes?.reduce(
            (acc, attr) => {
              acc[attr.attribute_code] = attr.value_number ?? attr.value_text ?? attr.value_boolean;
              return acc;
            },
            {} as Record<string, any>
          ) || {},
      },
      media: {
        images:
          property.media
            ?.filter((m) => m.media_type === 'IMAGE')
            .map((m) => ({ url: m.media_url, type: 'IMAGE' })) || [],
        videoUrl: property.media?.find((m) => m.media_type === 'VIDEO')?.media_url || '',
        tour3dUrl: property.media?.find((m) => m.media_type === 'VIRTUAL_TOUR')?.media_url || '',
      },
    };
  }, [property]);

  if (isLoading) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className='flex h-[400px] flex-col items-center justify-center text-center'>
        <h2 className='text-2xl font-bold'>Error loading property</h2>
        <p className='text-muted-foreground'>Could not fetch property details. Please try again.</p>
      </div>
    );
  }

  return (
    <div className='container py-8 max-w-5xl mx-auto'>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <PropertyForm initialData={initialData} propertyId={id} isEditMode={true} />
      </APIProvider>
    </div>
  );
}
