'use client';

import { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/shared/config/i18n/navigation';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';
import { createPropertyFormSchema, PropertyFormValues } from '../model/property-form.schema';
import { PropertyInfoStep } from './property-info-step';
import { PropertyMediaStep } from './property-media-step';
import { useCreateProperty } from '@/entities/property/api/use-create-property';
import { useUpdateProperty } from '@/entities/property/api/use-update-property';
import type {
  CreatePropertyRequest,
  PropertyMediaRequest,
  PropertyAttributeRequest,
} from '@/entities/property/api/property-api.types';
import { PropertyAttribute, ATTRIBUTE_TYPES } from '@/shared/config/property-types';

interface PropertyFormProps {
  initialData?: Partial<PropertyFormValues>;
  propertyId?: string;
  isEditMode?: boolean;
}

export function PropertyForm({ initialData, propertyId, isEditMode = false }: PropertyFormProps) {
  const t = useTranslations('PropertyManagement');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();

  const isPending = createProperty.isPending || updateProperty.isPending;

  const schema = useMemo(() => createPropertyFormSchema(t), [t]);

  const methods = useForm<PropertyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      info: {
        city: '',
        district: '',
        ward: '',
        streetAddress: '',
        location: { lat: 0, lng: 0 },
        landSize: 0,
        usableSize: 0,
        width: 0,
        length: 0,
        propertyType: '',
        dynamicAttributes: {},
      },
      media: {
        images: [],
        videoUrl: '',
        tour3dUrl: '',
      },
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger } = methods;

  const STEPS = [
    { id: 0, component: <PropertyInfoStep /> },
    { id: 1, component: <PropertyMediaStep /> },
  ];

  const transformToRequest = (data: PropertyFormValues): CreatePropertyRequest => {
    const mediaItems: PropertyMediaRequest[] = [];

    if (data.media.images && data.media.images.length > 0) {
      data.media.images.forEach((item) => {
        mediaItems.push({
          url: item.url,
          type: item.type,
        });
      });
    }

    if (data.media.videoUrl) {
      mediaItems.push({
        url: data.media.videoUrl,
        type: 'VIDEO',
      });
    }

    if (data.media.tour3dUrl) {
      mediaItems.push({
        url: data.media.tour3dUrl,
        type: 'VIRTUAL_TOUR',
      });
    }

    return {
      location_id: data.info.ward,
      property_type_id: data.info.propertyType,
      street_address: data.info.streetAddress,
      latitude: data.info.location.lat,
      longitude: data.info.location.lng,
      land_size_m2: data.info.landSize || undefined,
      usable_size_m2: data.info.usableSize || undefined,
      length_m: data.info.length || undefined,
      amenity_ids: data.info.amenityIds || [],
      attributes: Object.entries(data.info.dynamicAttributes || {}).map(([code, value]) => {
        const type = ATTRIBUTE_TYPES[code as PropertyAttribute];
        return {
          attribute_code: code,
          value_number: type === 'number' ? Number(value) : undefined,
          value_boolean: type === 'boolean' ? Boolean(value) : undefined,
          value_text: type === 'text' ? String(value) : undefined,
        } as PropertyAttributeRequest;
      }),
      media: mediaItems.length > 0 ? mediaItems : undefined,
    };
  };

  const handleNext = async () => {
    const fieldsToValidate = currentStep === 0 ? 'info' : 'media';
    const isStepValid = await trigger(fieldsToValidate as 'info' | 'media');

    if (isStepValid) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error(t('fillRequired'));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = (data: PropertyFormValues) => {
    const request = transformToRequest(data);

    if (isEditMode && propertyId) {
      updateProperty.mutate(
        { propertyId, request },
        {
          onSuccess: () => {
            toast.success(t('updateSuccess'));
            router.push('/dashboard/property');
          },
          onError: () => {
            toast.error(t('submitError'));
          },
        }
      );
    } else {
      createProperty.mutate(request, {
        onSuccess: () => {
          toast.success(t('createSuccess'));
          router.push('/dashboard/property');
        },
        onError: () => {
          toast.error(t('submitError'));
        },
      });
    }
  };

  return (
    <div className='max-w-4xl mx-auto py-8'>
      {/* Stepper Header */}
      <div className='flex items-center justify-center mb-8'>
        <div className='flex items-center'>
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors ${currentStep >= 0 ? 'border-primary bg-primary text-white' : 'border-slate-300 text-slate-500'}`}
          >
            1
          </div>
          <div className='text-sm font-medium ml-3 text-slate-700 dark:text-slate-300'>
            {t('tabInfo')}
          </div>
        </div>

        <div
          className={`w-24 h-1 mx-4 rounded-full transition-colors ${currentStep >= 1 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
        />

        <div className='flex items-center'>
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors ${currentStep >= 1 ? 'border-primary bg-primary text-white' : 'border-slate-300 text-slate-500'}`}
          >
            2
          </div>
          <div
            className={`text-sm font-medium ml-3 transition-colors ${currentStep >= 1 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}
          >
            {t('tabMedia')}
          </div>
        </div>
      </div>

      <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm'>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {STEPS[currentStep].component}

            <div className='pt-8 border-t flex justify-between items-center mt-10'>
              {currentStep > 0 ? (
                <Button type='button' variant='outline' onClick={handleBack} disabled={isPending}>
                  {t('back')}
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => router.push('/dashboard/property')}
                  disabled={isPending}
                >
                  {t('cancel')}
                </Button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <Button type='button' onClick={handleNext} disabled={isPending}>
                  {t('continue')}
                </Button>
              ) : (
                <div className='flex gap-4'>
                  <Button type='submit' variant='outline' disabled={isPending}>
                    {t('skipSubmit')}
                  </Button>
                  <Button type='submit' disabled={isPending}>
                    {isPending ? t('saving') : isEditMode ? t('update') : t('create')}
                  </Button>
                </div>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
