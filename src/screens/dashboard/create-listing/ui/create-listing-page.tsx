'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronRight, MapPin, Maximize2, Home, Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { RealVistaPagination } from '@/shared/ui/realvista-pagination/realvista-pagination';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mediaApi } from '@/entities/media/api/media.api';
import type { UserProperty, CreateListingFormData, CreateListingPayload } from '@/features/create-listing-modal/model/types';
import { useCreateListing } from '@/features/create-listing-modal/api/use-create-listing';
import { ListingInformationStep } from '@/features/create-listing-modal/ui/listing-information-step';
import { useRouter } from '@/shared/config/i18n/navigation';
import { propertyQueries } from '@/entities/property';
import { usePropertyDetail } from '@/entities/property/api/use-property-detail';

function PropertyStatusBadge({ status }: { status: UserProperty['status'] | string }) {
  const t = useTranslations('CreateListingModal');

  const statusConfig: Record<string, { label: string; className: string }> = {
    DRAFT: {
      label: t('propertyStatus.draft'),
      className: 'bg-muted text-muted-foreground',
    },
    PENDING: {
      label: t('propertyStatus.pending'),
      className: 'bg-blue-50 text-blue-700',
    },
    VERIFIED: {
      label: t('propertyStatus.verified'),
      className: 'bg-indigo-50 text-indigo-700',
    },
    REJECTED: {
      label: t('propertyStatus.rejected'),
      className: 'bg-red-50 text-red-700',
    },
    AVAILABLE: {
      label: t('propertyStatus.available'),
      className: 'bg-emerald-50 text-emerald-700',
    },
    RESERVED: {
      label: t('propertyStatus.reserved'),
      className: 'bg-amber-50 text-amber-700',
    },
    SOLD: {
      label: t('propertyStatus.sold'),
      className: 'bg-red-50 text-red-700',
    },
    RENTED: {
      label: t('propertyStatus.rented'),
      className: 'bg-teal-50 text-teal-700',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function PropertyCard({
  property,
  isSelected,
  onSelect,
}: {
  property: UserProperty;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations('CreateListingModal');
  const fullAddress = [
    property.streetAddress,
    property.location.wardName,
    property.location.districtName,
    property.location.cityName,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'group relative flex w-full items-start gap-4 rounded-xl border-[1.5px] p-4 text-left transition-all duration-200',
        isSelected
          ? 'border-primary bg-primary/5 shadow-[0px_0px_20px_0px_rgba(112,101,240,0.15)]'
          : 'border-primary/20 bg-white hover:border-primary/40 hover:bg-primary/5'
      )}
    >
      {/* Thumbnail */}
      <div className='relative h-[80px] w-[112px] shrink-0 overflow-hidden rounded-lg'>
        {property.thumbnailUrl ? (
          <Image
            src={property.thumbnailUrl}
            alt={property.streetAddress}
            fill
            className='object-cover'
            sizes='112px'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-primary/5'>
            <Home className='h-6 w-6 text-muted-foreground/60' />
          </div>
        )}
      </div>

      {/* Info */}
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <div className='flex items-center gap-2'>
          <span className='truncate text-sm font-bold leading-tight text-foreground'>
            {property.streetAddress}
          </span>
          <PropertyStatusBadge status={property.status} />
        </div>

        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <MapPin className='h-3 w-3 shrink-0' />
          <span className='truncate'>{fullAddress}</span>
        </div>

        <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
          <span className='flex items-center gap-1'>
            <Home className='h-3 w-3' />
            {property.propertyType.propertyTypeName}
          </span>
          {property.landSizeM2 && (
            <span className='flex items-center gap-1'>
              <Maximize2 className='h-3 w-3' />
              {t('landSize', { size: property.landSizeM2 })}
            </span>
          )}
          {property.usableSizeM2 && (
            <span className='flex items-center gap-1'>
              <Maximize2 className='h-3 w-3' />
              {t('usableSize', { size: property.usableSizeM2 })}
            </span>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      <div
        className={cn(
          'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isSelected
            ? 'border-primary bg-primary'
            : 'border-primary/20 bg-white group-hover:border-primary/40'
        )}
      >
        {isSelected && <Check className='h-3 w-3 text-white' strokeWidth={3} />}
      </div>
    </button>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const t = useTranslations('CreateListingModal');

  const steps = [
    { number: 1, label: t('steps.request') },
    { number: 2, label: t('steps.listingInformation') },
  ];

  return (
    <div className='flex items-center gap-4'>
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className='flex items-center gap-2'>
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                step.number <= currentStep
                  ? 'bg-primary text-white'
                  : 'bg-primary/5 text-foreground'
              )}
            >
              {step.number}
            </div>
            <span
              className={cn(
                'text-sm md:text-base font-medium hidden sm:block',
                step.number <= currentStep ? 'text-foreground' : 'text-muted-foreground/70'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && <ChevronRight className='h-5 w-5 text-muted-foreground/70' />}
        </React.Fragment>
      ))}
    </div>
  );
}

const ITEMS_PER_PAGE = 4;

export function CreateListingPage() {
  const t = useTranslations('CreateListingModal');
  const router = useRouter();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedProperty, setSelectedProperty] = React.useState<UserProperty | null>(null);

  const { data, isLoading } = useQuery({
    ...propertyQueries.myProperties({
      page: currentPage - 1,
      size: ITEMS_PER_PAGE,
      status: 'AVAILABLE',
    }),
    enabled: currentStep === 1,
  });

  const propertiesResponse = data?.payload?.data;
  const rawProperties = propertiesResponse?.content || [];
  const totalPages = propertiesResponse?.total_pages || 0;

  const properties: UserProperty[] = rawProperties.map((p: any) => {
    const standardMedia = (p.media ?? []).filter((m: any) => m.is_property_standard);
    const primaryMedia =
      standardMedia.find((m: any) => m.is_primary) ?? standardMedia[0] ?? p.media?.[0];

    return {
      propertyId: p.property_id,
      streetAddress: p.street_address,
      landSizeM2: p.land_size_m2,
      usableSizeM2: p.usable_size_m2,
      widthM: p.width_m,
      lengthM: p.length_m,
      areaSqft: p.area_sqft,
      description: p.description,
      status: p.status,
      thumbnailUrl: primaryMedia?.thumbnail_url ?? primaryMedia?.media_url ?? null,
      location: {
        locationId: p.location_info?.location_id ?? '',
        cityName: p.location_info?.city_name ?? '',
        districtName: p.location_info?.district_name ?? '',
        wardName: p.location_info?.ward_name ?? '',
        latitude: p.location_info?.latitude ?? null,
        longitude: p.location_info?.longitude ?? null,
      },
      propertyType: {
        propertyTypeId: p.property_type_info?.property_type_id ?? p.property_type_id,
        propertyTypeName: p.property_type_info?.property_type_name ?? '',
        propertyTypeCode: p.property_type_info?.property_type_code ?? '',
        propertyCategoryName: p.property_type_info?.property_category_name ?? '',
        propertyCategoryCode: p.property_type_info?.property_category_code ?? '',
      },
      attributes: (p.attributes ?? []).map((attr: any) => ({
        attributeId: attr.attribute_id,
        attributeCode: attr.attribute_code,
        attributeName: attr.attribute_name,
        dataType: attr.data_type,
        icon: attr.icon,
        unit: attr.unit,
        valueNumber: attr.value_number,
        valueText: attr.value_text,
        valueBoolean: attr.value_boolean,
        displayValue: attr.display_value,
      })),
      amenities: (p.amenities ?? []).map((a: any) => ({
        amenityId: a.amenity_id,
        amenityName: a.amenity_name,
      })),
      media: (p.media ?? []).map((m: any) => ({
        mediaId: m.media_id,
        mediaType: m.media_type,
        mediaUrl: m.media_url,
        thumbnailUrl: m.thumbnail_url,
        isPrimary: m.is_primary,
        isPropertyStandard: m.is_property_standard,
        displayOrder: m.display_order,
        roomName: m.metadata?.room_name ?? null,
      })),
    };
  });

  const handleNextStep = () => {
    if (selectedProperty) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const createListingMutation = useCreateListing();

  // Fetch full property detail when at step 2 to get all attributes (list endpoint returns fewer)
  const { data: propertyDetail } = usePropertyDetail(
    currentStep === 2 ? selectedProperty?.propertyId : undefined
  );

  const enrichedProperty: UserProperty | null = React.useMemo(() => {
    if (!selectedProperty) return null;
    if (!propertyDetail?.attributes) return selectedProperty;
    return {
      ...selectedProperty,
      attributes: propertyDetail.attributes.map((attr) => ({
        attributeId: attr.attribute_id,
        attributeCode: attr.attribute_code,
        attributeName: attr.attribute_name,
        dataType: attr.data_type,
        icon: attr.icon,
        unit: attr.unit,
        valueNumber: attr.value_number,
        valueText: attr.value_text,
        valueBoolean: attr.value_boolean,
        displayValue: null,
      })),
    };
  }, [selectedProperty, propertyDetail]);

  const handleSubmit = async (data: CreateListingFormData) => {
    // Backend uses snake_case JSON naming (Jackson PropertyNamingStrategies.SNAKE_CASE)
    const payload: CreateListingPayload = {
      property_id: data.propertyId,
      listing_type: data.listingType,
      name: data.name.trim(),
      price: Number(data.price),
      min_price: data.minPrice.trim() ? Number(data.minPrice) : null,
      max_price: data.maxPrice.trim() ? Number(data.maxPrice) : null,
      is_negotiable: data.isNegotiable,
      available_from: data.availableFrom || null,
      content: data.content.trim() || null,
      media_ids: data.selectedMediaIds.length > 0 ? [...data.selectedMediaIds] : [],
      primary_media_id:
        data.primaryMediaId && !data.primaryMediaId.startsWith('new:') ? data.primaryMediaId : null,
      should_publish: data.shouldPublish,
    };

    try {
      if (data.newFiles && data.newFiles.length > 0) {
        const uploadRes = await mediaApi.uploadBulkMedia(data.newFiles, 'listings');
        if (
          uploadRes.status < 200 ||
          uploadRes.status >= 300 ||
          uploadRes.payload.data.failed_count > 0 ||
          !uploadRes.payload.data.uploaded_files
        ) {
          toast.error(t('mediaUploadError', { fallback: 'Failed to upload some media files.' }));
          return;
        }

        const uploadedResults = uploadRes.payload.data.uploaded_files;
        const newMediaIds = uploadedResults.map((res: { media_id: string }) => res.media_id);

        // Add newly uploaded media IDs to the list
        payload.media_ids = [...(payload.media_ids || []), ...newMediaIds];

        // If a new file was set as primary, resolve its real UUID
        if (data.primaryMediaId?.startsWith('new:')) {
          const index = parseInt(data.primaryMediaId.split(':')[1], 10);
          if (uploadedResults[index]) {
            payload.primary_media_id = uploadedResults[index].media_id;
          }
        }
      }

      // If no media selected/uploaded, media_ids might be empty
      if (payload.media_ids && payload.media_ids.length === 0) {
        payload.media_ids = undefined;
      }

      await createListingMutation.mutateAsync(payload);
      toast.success(t('createSuccess'));
      router.push('/dashboard/listings');
    } catch {
      toast.error(t('createError'));
    }
  };

  return (
    <div className='h-full overflow-hidden flex flex-col p-4 md:p-6'>
      <div className='rounded-2xl border border-primary/20 overflow-hidden bg-white shadow-lg flex flex-col flex-1 max-w-5xl mx-auto w-full min-h-0'>
        {/* Header - Fixed */}
        <div className='shrink-0'>
          <div className='space-y-3 px-4 md:px-8 pt-6 md:pt-8 pb-0 text-center'>
            <h1 className='text-2xl md:text-[28px] font-bold leading-tight tracking-[-0.28px] text-foreground'>
              {t('title')}
            </h1>
            <p className='mx-auto max-w-md text-sm md:text-base leading-relaxed text-muted-foreground/70'>
              {t('subtitle')}
            </p>
          </div>

          {/* Step indicator */}
          <div className='flex justify-center border-b border-primary/20 px-4 md:px-8 pb-4 md:pb-6 mt-4'>
            <StepIndicator currentStep={currentStep} />
          </div>
        </div>

        {/* Step 1: Property Selection */}
        {currentStep === 1 && (
          <>
            {/* Scrollable content - Flex 1 */}
            <div className='flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6'>
              {/* Property Selection */}
              <div className='rounded-xl border-[1.5px] border-primary/20 p-4 md:p-6'>
                <h3 className='mb-4 text-lg font-bold leading-snug tracking-tight text-foreground'>
                  {t('selectProperty')}
                </h3>

                <div className='flex flex-col gap-3'>
                  {isLoading ? (
                    <div className='flex justify-center py-8'>
                      <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
                    </div>
                  ) : properties.length === 0 ? (
                    <div className='flex justify-center py-8'>
                      <span className='text-muted-foreground/70'>
                        {t('noProperties', { fallback: 'No properties found' })}
                      </span>
                    </div>
                  ) : (
                    properties.map((property) => (
                      <PropertyCard
                        key={property.propertyId}
                        property={property}
                        isSelected={selectedProperty?.propertyId === property.propertyId}
                        onSelect={() => setSelectedProperty(property)}
                      />
                    ))
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='mt-6 flex justify-center'>
                    <RealVistaPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer — Next button - Fixed */}
            <div className='shrink-0 flex justify-end border-t border-primary/20 px-4 md:px-8 py-4 md:py-5 bg-white'>
              <button
                type='button'
                disabled={!selectedProperty}
                onClick={handleNextStep}
                className={cn(
                  'flex w-full sm:min-w-[160px] sm:w-auto items-center justify-center rounded-lg px-8 py-3 md:py-4 text-base font-bold text-white transition-all',
                  selectedProperty
                    ? 'bg-primary hover:bg-primary/90 shadow-[0px_4px_16px_0px_rgba(112,101,240,0.3)]'
                    : 'bg-primary/30 cursor-not-allowed'
                )}
              >
                {t('next')}
              </button>
            </div>
          </>
        )}

        {/* Step 2: Listing Information */}
        {currentStep === 2 && enrichedProperty && (
          <ListingInformationStep
            selectedProperty={enrichedProperty}
            onPrevious={handlePreviousStep}
            onSubmit={handleSubmit}
            isSubmitting={createListingMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
