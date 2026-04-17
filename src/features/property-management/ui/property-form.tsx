'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/shared/config/i18n/navigation';
import { toast } from 'sonner';
import { Check, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/ui/button';
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
import { useUploadMedia } from '@/entities/media/api/use-upload-media';
import type {
  CreatePropertyRequest,
  PropertyMediaRequest,
  PropertyAttributeRequest,
} from '@/entities/property/api/property-api.types';
import { PropertyAttribute, ATTRIBUTE_TYPES } from '@/shared/config/property-types';
import { AgentVerificationModal } from './components/agent-verification-modal';
import { cn } from '@/shared/lib/utils';

interface PropertyFormProps {
  initialData?: Partial<PropertyFormValues>;
  propertyId?: string;
  isEditMode?: boolean;
}

const DRAFT_KEY = 'property-form-draft';

function readDraft(): { step: number; values: PropertyFormValues } | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function hasErrors(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.message === 'string' && typeof o.type === 'string') return true;
  return Object.values(o).some(hasErrors);
}

export function PropertyForm({ initialData, propertyId, isEditMode = false }: PropertyFormProps) {
  const t = useTranslations('PropertyManagement');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();
  const [currentStep, setCurrentStep] = useState(() => {
    if (isEditMode || typeof window === 'undefined') return 0;
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (!saved) return 0;
      const parsed = JSON.parse(saved);
      return typeof parsed.step === 'number' ? parsed.step : 0;
    } catch {
      return 0;
    }
  });
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'DRAFT' | 'AVAILABLE'>('AVAILABLE');

  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const uploadMedia = useUploadMedia();
  const assignAgent = useMutation({
    mutationFn: (id: string) => propertyApi.assignAgent(id),
  });

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [infoHasError, setInfoHasError] = useState(false);
  const isPending =
    createProperty.isPending ||
    updateProperty.isPending ||
    assignAgent.isPending ||
    isUploadingMedia;

  const schema = useMemo(() => createPropertyFormSchema(t), [t]);

  const methods = useForm<PropertyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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
        landSize: undefined,
        usableSize: undefined,
        width: undefined,
        length: undefined,
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
      ...initialData,
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger, formState: { errors } } = methods;

  const clearDraft = useCallback(() => sessionStorage.removeItem(DRAFT_KEY), [DRAFT_KEY]);

  // Restore form values from sessionStorage on mount (create mode only)
  useEffect(() => {
    if (isEditMode) return;
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { step: number; values: PropertyFormValues };
      if (parsed.values) {
        methods.reset(parsed.values);
        // Re-persist immediately so the restored values are saved under the current key
        const { newFiles: _nf, ...media } = (parsed.values.media ?? {}) as Record<string, unknown>;
        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ ...parsed, values: { ...parsed.values, media } })
        );
      }
    } catch {
      // corrupt data, ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist step whenever it changes
  useEffect(() => {
    if (isEditMode) return;
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      const existing = saved ? JSON.parse(saved) : {};
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...existing, step: currentStep }));
    } catch { /* ignore quota errors */ }
  }, [currentStep, isEditMode, DRAFT_KEY]);

  // Persist form values on every change (skip File objects which can't be serialized)
  useEffect(() => {
    if (isEditMode) return;
    const { unsubscribe } = methods.watch(() => {
      try {
        const currentValues = methods.getValues();
        const { newFiles: _newFiles, ...media } = (currentValues.media ?? {}) as Record<string, unknown>;
        const saved = sessionStorage.getItem(DRAFT_KEY);
        const existing = saved ? JSON.parse(saved) : {};
        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ ...existing, values: { ...currentValues, media } })
        );
      } catch { /* ignore quota errors */ }
    });
    return unsubscribe;
  }, [methods, isEditMode, DRAFT_KEY]);

  const ALL_STEPS = useMemo(
    () => [
      { id: 'role', component: <PropertySearchStep />, label: t('tabRole') },
      { id: 'info', component: <PropertyInfoStep onErrorChange={setInfoHasError} />, label: t('tabInfo') },
      { id: 'media', component: <PropertyMediaStep />, label: t('tabMedia') },
    ],
    [t]
  );

  const isExistingProp = methods.watch('isExistingProperty');

  const watchLocation = methods.watch('info.location');
  const watchStreetAddress = methods.watch('info.streetAddress');
  const watchIsExisting = methods.watch('isExistingProperty');
  const watchSelectedId = methods.watch('selectedPropertyId');

  const STEPS = useMemo(() => {
    if (isEditMode) {
      return ALL_STEPS.filter((step) => step.id !== 'role');
    }
    if (isExistingProp) {
      return ALL_STEPS.filter((step) => step.id === 'role');
    }
    return ALL_STEPS;
  }, [isEditMode, ALL_STEPS, isExistingProp]);

  const isNextDisabled = useMemo(() => {
    if (isPending) return true;
    const stepId = STEPS[currentStep]?.id;
    if (stepId === 'role') {
      if (watchIsExisting) return !watchSelectedId;
      return !watchLocation?.lat || watchLocation?.lat === 0 || !watchStreetAddress?.trim();
    }
    if (stepId === 'info') {
      return infoHasError;
    }
    if (stepId === 'media') {
      return hasErrors(errors.media);
    }
    return false;
  }, [
    isPending,
    currentStep,
    STEPS,
    watchLocation,
    watchStreetAddress,
    watchIsExisting,
    watchSelectedId,
    infoHasError,
    errors,
  ]);

  const transformToRequest = (data: PropertyFormValues, status: string): CreatePropertyRequest => {
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
      street_address: data.info.streetAddress || '',
      latitude: data.info.location!.lat,
      longitude: data.info.location!.lng,
      land_size_m2: data.info.landSize != null ? data.info.landSize : undefined,
      usable_size_m2: data.info.usableSize != null ? data.info.usableSize : undefined,
      width_m: data.info.width != null ? data.info.width : undefined,
      length_m: data.info.length != null ? data.info.length : undefined,
      amenity_ids: data.info.amenityIds || [],
      status,
      price_range: data.info.priceRange
        ? {
            rent: data.info.priceRange.rent?.min != null || data.info.priceRange.rent?.max != null
              ? { min: data.info.priceRange.rent?.min ?? undefined, max: data.info.priceRange.rent?.max ?? undefined }
              : undefined,
            buy: data.info.priceRange.buy?.min != null || data.info.priceRange.buy?.max != null
              ? { min: data.info.priceRange.buy?.min ?? undefined, max: data.info.priceRange.buy?.max ?? undefined }
              : undefined,
          }
        : undefined,
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

  const onSubmit = async (data: PropertyFormValues) => {
    console.log('Form Submit Data:', data);

    try {
      // 1. Upload any new files first
      let uploadedUrls: UploadedMediaItem[] = [];
      const newFiles: File[] = data.media.newFiles || [];

      if (newFiles.length > 0) {
        setIsUploadingMedia(true);
        const uploadPromises = newFiles.map((file: File) =>
          uploadMedia.mutateAsync({ file, folder: 'properties' }).then((result) => ({
            url: result.payload.data.media_url,
            type: file.type.startsWith('video/') ? ('VIDEO' as const) : ('IMAGE' as const),
          }))
        );

        uploadedUrls = await Promise.all(uploadPromises);
        setIsUploadingMedia(false);
      }

      // Combine existing images with newly uploaded ones
      const finalData = {
        ...data,
        media: {
          ...data.media,
          images: [...(data.media.images || []), ...uploadedUrls],
        },
      };

      if (isEditMode && propertyId) {
        const request = transformToRequest(finalData, submissionStatus);
        console.log('[PropertyForm] update request:', JSON.stringify(request, null, 2));
        updateProperty.mutate(
          { propertyId, request },
          {
            onSuccess: () => {
              clearDraft();
              toast.success(t('updateSuccess'));
              router.push('/dashboard/property');
            },
            onError: (error) => {
              console.error('[PropertyForm] update error:', error);
              const message = (error as { payload?: { message?: string } })?.payload?.message;
              toast.error(message || t('submitError'));
            },
          }
        );
      } else if (finalData.isExistingProperty && finalData.selectedPropertyId) {
        assignAgent.mutate(finalData.selectedPropertyId, {
          onSuccess: () => {
            clearDraft();
            toast.success(t('createSuccess'));
            queryClient.invalidateQueries({ queryKey: ['my-properties'] });
            const currentUserId = session?.user?.id;
            const ownerId = finalData.role.ownerId;
            const isSelfOwned = !!(ownerId && currentUserId && ownerId === currentUserId);

            if (finalData.role.role === 'AGENT' && !isSelfOwned) {
              setCreatedPropertyId(finalData.selectedPropertyId!);
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
        const request = transformToRequest(finalData, submissionStatus);
        createProperty.mutate(request, {
          onSuccess: (response: { payload: { data: { property_id: string } } }) => {
            clearDraft();
            toast.success(t('createSuccess'));
            queryClient.invalidateQueries({ queryKey: ['my-properties'] });

            const propId = response?.payload?.data?.property_id;
            const role = finalData.role.role;
            const ownerId = finalData.role.ownerId;
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
    } catch (error) {
      console.error('Error during media upload or submission:', error);
      toast.error(t('uploadError') || 'Error uploading media');
      setIsUploadingMedia(false);
    }
  };

  return (
    <div className='h-full mx-auto max-w-[736px] font-[family-name:var(--font-plus-jakarta-sans),sans-serif]'>
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
                  onClick={() => { clearDraft(); router.push('/dashboard/property'); }}
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
                  disabled={isNextDisabled}
                  className='w-[160px] h-12 rounded-lg bg-[#7065F0] text-white font-bold hover:bg-[#5B51D9] border-none shadow-none disabled:opacity-50'
                >
                  {t('continue')}
                </Button>
              ) : (
                <div className='flex gap-4'>
                  <Button
                    type='submit'
                    disabled={
                      isPending ||
                      !!(methods.formState.errors.media as { newFiles?: object })?.newFiles
                    }
                    onClick={() => setSubmissionStatus('DRAFT')}
                    className='w-[160px] h-12 rounded-lg bg-[#F7F7FD] text-[#7065F0] font-bold hover:bg-[#E8E6F9] border-none shadow-none'
                  >
                    {t('saveDraft')}
                  </Button>
                  <Button
                    type='submit'
                    disabled={
                      isPending ||
                      !!(methods.formState.errors.media as { newFiles?: object })?.newFiles
                    }
                    onClick={() => setSubmissionStatus('AVAILABLE')}
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
