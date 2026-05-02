'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/shared/config/i18n/navigation';
import { APIProvider } from '@vis.gl/react-google-maps';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { usePropertyDetail } from '@/entities/property/api/use-property-detail';
import { propertyApi } from '@/entities/property/api/property.api';
import type { CreatePropertyRequest } from '@/entities/property/api/property-api.types';
import type { PropertyFormValues } from '@/features/property-management';
import { PropertyForm } from '@/features/property-management';
import { ROUTES } from '@/shared/config/routes';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface Props {
  propertyId: string;
}

export function AdminPropertyEditPage({ propertyId }: Props) {
  const t = useTranslations('AdminManageProperties');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: property, isLoading, isError } = usePropertyDetail(propertyId);

  const updateMutation = useMutation({
    mutationFn: (request: CreatePropertyRequest) =>
      propertyApi.adminUpdateProperty({
        propertyId,
        request,
      }),
    onSuccess: () => {
      toast.success(t('edit.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['properties', 'admin'] });
      router.push(ROUTES.dashboard.manageProperties as Parameters<typeof router.push>[0]);
    },
    onError: (error: unknown) => {
      const message = (error as { payload?: { message?: string } })?.payload?.message;
      toast.error(message || t('edit.updateError'));
    },
  });

  const handleAdminSubmit = (request: CreatePropertyRequest) => {
    updateMutation.mutate(request);
  };

  const initialData = React.useMemo<Partial<PropertyFormValues> | undefined>(() => {
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
            {} as Record<string, unknown>
          ) || {},
        priceRange: property.price_range
          ? {
              rent: property.price_range.rent
                ? {
                    min: property.price_range.rent.min ?? undefined,
                    max: property.price_range.rent.max ?? undefined,
                  }
                : undefined,
              buy: property.price_range.buy
                ? {
                    min: property.price_range.buy.min ?? undefined,
                    max: property.price_range.buy.max ?? undefined,
                  }
                : undefined,
            }
          : undefined,
      },
      media: {
        images:
          property.media
            ?.filter((m) => m.media_type === 'IMAGE')
            .map((m) => ({ url: m.media_url, type: 'IMAGE' as const })) || [],
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
        <h2 className='text-2xl font-bold'>{t('edit.loadError')}</h2>
      </div>
    );
  }

  return (
    <div className='container py-8 max-w-5xl mx-auto'>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <PropertyForm
          initialData={initialData}
          propertyId={propertyId}
          isEditMode={true}
          onAdminSubmit={handleAdminSubmit}
        />
      </APIProvider>
    </div>
  );
}
