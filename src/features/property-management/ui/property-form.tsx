'use client';

import { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/shared/config/i18n/navigation';
import { toast } from 'sonner';
import { Check, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import {
  createPropertyFormSchema,
  PropertyFormValues,
  UploadedMediaItem,
} from '../model/property-form.schema';
import { PropertyInfoStep } from './property-info-step';
import { PropertyMediaStep } from './property-media-step';
import { PropertySearchStep } from './property-search-step';
import { useCreateProperty } from '@/entities/property/api/use-create-property';
import { useUpdateProperty } from '@/entities/property/api/use-update-property';
import { propertyApi } from '@/entities/property/api/property.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthSession } from '@/features/auth/model/use-auth-session';
import type {
  CreatePropertyRequest,
  PropertyMediaRequest,
  PropertyAttributeRequest,
} from '@/entities/property/api/property-api.types';
import { PropertyAttribute, ATTRIBUTE_TYPES } from '@/shared/config/property-types';
import { AgentVerificationModal } from './components/agent-verification-modal';
import { cn } from '@/shared/lib/utils';
import { extractStreetAddress } from '@/shared/lib/location.lib';

interface PropertyFormProps {
  initialData?: Partial<PropertyFormValues>;
  propertyId?: string;
  isEditMode?: boolean;
}

export function PropertyForm({ initialData, propertyId, isEditMode = false }: PropertyFormProps) {
  const t = useTranslations('PropertyManagement');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const assignAgent = useMutation({
    mutationFn: (id: string) => propertyApi.assignAgent(id),
  });

  const isPending = createProperty.isPending || updateProperty.isPending || assignAgent.isPending;

  const schema = useMemo(() => createPropertyFormSchema(t), [t]);

  const methods = useForm<PropertyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      role: {
        role: 'OWNER',
        ownerEmail: '',
        ownerId: '',
        ownerName: '',
        ownerMaskedPhone: '',
      },
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
      isExistingProperty: false,
      selectedPropertyId: null,
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger } = methods;

  const ALL_STEPS = useMemo(
    () => [
      { id: 'role', component: <PropertySearchStep />, label: t('tabRole') },
      { id: 'info', component: <PropertyInfoStep />, label: t('tabInfo') },
      { id: 'media', component: <PropertyMediaStep />, label: t('tabMedia') },
    ],
    [t]
  );

  const isExistingProp = methods.watch('isExistingProperty');

  const STEPS = useMemo(() => {
    if (isEditMode) {
      return ALL_STEPS.filter((step) => step.id !== 'role');
    }
    if (isExistingProp) {
      return ALL_STEPS.filter((step) => step.id === 'role');
    }
    return ALL_STEPS;
  }, [isEditMode, ALL_STEPS, isExistingProp]);

  const transformToRequest = (data: PropertyFormValues): CreatePropertyRequest => {
    const mediaItems: PropertyMediaRequest[] = [];

    if (data.media.images && data.media.images.length > 0) {
      data.media.images.forEach((item: UploadedMediaItem) => {
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
      location_id: data.info.ward || undefined,
      property_type_id: data.info.propertyType!,
      street_address: extractStreetAddress(data.info.streetAddress || ''),
      latitude: data.info.location!.lat,
      longitude: data.info.location!.lng,
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
      owner_id: data.role.role === 'AGENT' ? data.role.ownerId : undefined,
    };
  };

  const handleNext = async () => {
    const stepId = STEPS[currentStep].id as 'role' | 'info' | 'media';
    const isStepValid = await trigger(stepId);

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
    console.log('Form Submit Data:', data);

    if (isEditMode && propertyId) {
      console.log(`property create request is: ${JSON.stringify(data)}`);
      const request = transformToRequest(data);
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
    } else if (data.isExistingProperty && data.selectedPropertyId) {
      assignAgent.mutate(data.selectedPropertyId, {
        onSuccess: () => {
          toast.success(t('createSuccess'));
          queryClient.invalidateQueries({ queryKey: ['my-properties'] });
          const currentUserId = session?.user?.id;
          const ownerId = data.role.ownerId;
          const isSelfOwned = !!(ownerId && currentUserId && ownerId === currentUserId);

          if (data.role.role === 'AGENT' && !isSelfOwned) {
            setCreatedPropertyId(data.selectedPropertyId!);
            setIsVerificationModalOpen(true);
          } else {
            router.push('/dashboard/property');
          }
        },
        onError: () => {
          toast.error(t('submitError'));
        },
      });
    } else {
      const request = transformToRequest(data);
      createProperty.mutate(request, {
        onSuccess: (response: { payload: { data: { property_id: string } } }) => {
          toast.success(t('createSuccess'));
          queryClient.invalidateQueries({ queryKey: ['my-properties'] });

          const propId = response?.payload?.data?.property_id;
          const role = data.role.role;
          const ownerId = data.role.ownerId;
          const currentUserId = session?.user?.id;

          const isSelfOwned = !!(ownerId && currentUserId && ownerId === currentUserId);

          if (role === 'AGENT' && propId && !isSelfOwned) {
            setCreatedPropertyId(propId);
            setIsVerificationModalOpen(true);
          } else {
            router.push('/dashboard/property');
          }
        },
        onError: () => {
          toast.error(t('submitError'));
        },
      });
    }
  };

  return (
    <div className='mx-auto max-w-[736px] font-[family-name:var(--font-plus-jakarta-sans),sans-serif]'>
      {/* Page Title */}
      <div className='flex flex-col items-center gap-4 text-center mb-8'>
        <h1 className='text-[32px] font-bold leading-[1.25] tracking-tight text-foreground'>
          {isEditMode
            ? t('editTitle', { default: 'Edit Property' })
            : t('createTitle', { default: 'Add New Property' })}
        </h1>
        <p className='text-base leading-[1.6] text-muted-foreground max-w-[544px]'>
          {t('formSubtitle', {
            default:
              'Make sure you have filled in all the necessary fields and have uploaded all the required files.',
          })}
        </p>
      </div>

      {/* Step Indicator */}
      <div className='flex items-center justify-center gap-4 mb-8'>
        {STEPS.map((step, index) => (
          <div key={step.id} className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              {/* Step circle */}
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  currentStep > index
                    ? 'bg-[#7065F0] text-white'
                    : currentStep === index
                      ? 'bg-[#7065F0] text-white'
                      : 'bg-[#E8E6F9] text-[#100A55]'
                )}
              >
                {currentStep > index ? <Check className='size-4' /> : index + 1}
              </div>
              {/* Step label */}
              <span className='text-base font-medium text-[#100A55]'>{step.label}</span>
            </div>

            {/* Step separator arrow */}
            {index < STEPS.length - 1 && (
              <ChevronRight className='size-5 text-[#100A55] opacity-50' />
            )}
          </div>
        ))}
      </div>

      <Separator className='mb-8 bg-[#E0DEF7]' />

      {/* Form Card */}
      <div className='rounded-lg border-[1.5px] border-[#E0DEF7] bg-white p-6 sm:p-8 shadow-sm'>
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit, (errors) => console.log('Validation Errors:', errors))}
            className='flex flex-col gap-6'
          >
            {STEPS[currentStep].component}

            {/* Navigation Buttons */}
            <div className='flex items-center justify-end gap-4 pt-6 mt-4 border-t border-[#E0DEF7]'>
              {currentStep > 0 ? (
                <Button
                  type='button'
                  onClick={handleBack}
                  disabled={isPending}
                  className='w-[160px] h-12 rounded-lg bg-[#F7F7FD] text-[#7065F0] font-bold hover:bg-[#E8E6F9] border-none shadow-none'
                >
                  {t('back')}
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => router.push('/dashboard/property')}
                  disabled={isPending}
                  className='h-12 rounded-lg text-muted-foreground hover:text-foreground'
                >
                  {t('cancel')}
                </Button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <Button
                  type='button'
                  onClick={handleNext}
                  disabled={isPending}
                  className='w-[160px] h-12 rounded-lg bg-[#7065F0] text-white font-bold hover:bg-[#5B51D9] border-none shadow-none'
                >
                  {t('continue')}
                </Button>
              ) : (
                <div className='flex gap-4'>
                  <Button
                    type='submit'
                    disabled={isPending}
                    className='w-[160px] h-12 rounded-lg bg-[#F7F7FD] text-[#7065F0] font-bold hover:bg-[#E8E6F9] border-none shadow-none'
                  >
                    {t('skipSubmit')}
                  </Button>
                  <Button
                    type='submit'
                    disabled={isPending}
                    className='w-[160px] h-12 rounded-lg bg-[#7065F0] text-white font-bold hover:bg-[#5B51D9] border-none shadow-none'
                  >
                    {isPending ? t('saving') : isEditMode ? t('update') : t('create')}
                  </Button>
                </div>
              )}
            </div>
          </form>
        </FormProvider>
      </div>

      {createdPropertyId && (
        <AgentVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setIsVerificationModalOpen(false);
            router.push('/dashboard/property');
          }}
          propertyId={createdPropertyId}
          ownerName={methods.getValues('role.ownerName') ?? ''}
          ownerPhone={methods.getValues('role.ownerPhone') ?? ''}
        />
      )}
    </div>
  );
}
