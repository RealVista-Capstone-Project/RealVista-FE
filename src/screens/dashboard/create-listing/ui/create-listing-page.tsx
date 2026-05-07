'use client';

import * as React from 'react';
import Image from 'next/image';
import { ArrowLeft, ChevronRight, MapPin, Maximize2, Home, Check, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mediaApi } from '@/entities/media/api/media.api';
import type {
  UserProperty,
  CreateListingFormData,
  CreateListingPayload,
} from '@/features/create-listing-modal/model/types';
import { useCreateListing } from '@/features/create-listing-modal/api/use-create-listing';
import { ListingInformationStep } from '@/features/create-listing-modal/ui/listing-information-step';
import { useRouter } from '@/shared/config/i18n/navigation';
import { Link } from '@/shared/config/i18n/navigation';
import { propertyQueries } from '@/entities/property';
import { usePropertyDetail } from '@/entities/property/api/use-property-detail';
import { handleErrorApi } from '@/shared/lib/utils/handle-error';
import type {
  PropertySummaryResponse,
  PropertyMediaItem,
  PropertyAttributeItem,
  PropertyAmenityItem,
} from '@/entities/property/api/property-api.types';

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
        'inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium',
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
  const isRented = property.status === 'RENTED';

  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'group relative flex w-full items-start gap-4 rounded-xl border-[1.5px] p-4 text-left transition-all duration-200',
        isSelected
          ? 'border-primary bg-primary/5 shadow-[0px_0px_20px_0px_color-mix(in_oklch,var(--primary)_15%,transparent)]'
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

        {isRented && (
          <p className='rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs leading-snug text-teal-800'>
            {property.allowRentListingWhenRented
              ? t('rentedPropertyRentAllowed')
              : t('rentedPropertySaleOnly')}
          </p>
        )}
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
    <div className='flex items-center gap-3'>
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className='flex items-center gap-1.5'>
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                step.number <= currentStep
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {step.number}
            </div>
            <span
              className={cn(
                'text-sm font-medium hidden sm:inline',
                step.number <= currentStep ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <ChevronRight className='h-[18px] w-[18px] shrink-0 text-muted-foreground/70' />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const MY_PROPERTIES_PAGE_SIZE = 20;

export function CreateListingPage() {
  const t = useTranslations('CreateListingModal');
  const tGlobal = useTranslations();
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedProperty, setSelectedProperty] = React.useState<UserProperty | null>(null);

  const myPropertiesInfiniteCriteria = React.useMemo(
    () => ({
      size: MY_PROPERTIES_PAGE_SIZE,
      statuses: ['AVAILABLE', 'RENTED'] as string[],
    }),
    []
  );

  const {
    data: propertiesInfiniteData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    ...propertyQueries.myPropertiesInfinite(myPropertiesInfiniteCriteria),
    enabled: currentStep === 1,
  });

  const rawProperties = React.useMemo(
    () => propertiesInfiniteData?.pages.flatMap((p) => p.payload?.data?.content ?? []) ?? [],
    [propertiesInfiniteData?.pages]
  );

  const properties: UserProperty[] = rawProperties.map((p: PropertySummaryResponse) => {
    const standardMedia = (p.media ?? []).filter((m: PropertyMediaItem) => m.is_property_standard);
    const primaryMedia =
      standardMedia.find((m: PropertyMediaItem) => m.is_primary) ?? standardMedia[0] ?? p.media?.[0];

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
      allowRentListingWhenRented: Boolean(p.allow_rent_listing_when_rented),
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
        propertyTypeId: p.property_type_info?.property_type_id ?? p.property_type_id ?? '',
        propertyTypeName: p.property_type_info?.property_type_name ?? '',
        propertyTypeCode: p.property_type_info?.property_type_code ?? '',
        propertyCategoryName: p.property_type_info?.property_category_name ?? '',
        propertyCategoryCode: p.property_type_info?.property_category_code ?? '',
      },
      attributes: (p.attributes ?? []).map((attr: PropertyAttributeItem) => ({
        attributeId: attr.attribute_id,
        attributeCode: attr.attribute_code,
        attributeName: attr.attribute_name,
        dataType: attr.data_type,
        icon: attr.icon,
        unit: attr.unit,
        valueNumber: attr.value_number,
        valueText: attr.value_text,
        valueBoolean: attr.value_boolean,
        displayValue: attr.display_value ?? null,
      })),
      amenities: (p.amenities ?? []).map((a: PropertyAmenityItem) => ({
        amenityId: a.amenity_id,
        amenityName: a.amenity_name,
      })),
      media: (p.media ?? []).map((m: PropertyMediaItem) => ({
        mediaId: m.media_id ?? '',
        mediaType: m.media_type ?? 'IMAGE',
        mediaUrl: m.media_url ?? '',
        thumbnailUrl: m.thumbnail_url ?? null,
        isPrimary: m.is_primary ?? false,
        isPropertyStandard: m.is_property_standard ?? false,
        displayOrder: m.display_order ?? 0,
        roomName: m.metadata?.room_name ?? null,
      })),
      priceRange: p.price_range ?? null,
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
    if (!propertyDetail) return selectedProperty;
    return {
      ...selectedProperty,
      allowRentListingWhenRented: Boolean(
        propertyDetail.allow_rent_listing_when_rented ?? selectedProperty.allowRentListingWhenRented
      ),
      priceRange: propertyDetail.price_range ?? selectedProperty.priceRange,
      attributes: propertyDetail.attributes
        ? propertyDetail.attributes.map((attr) => ({
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
          }))
        : selectedProperty.attributes,
    };
  }, [selectedProperty, propertyDetail]);

  const handleSubmit = async (data: CreateListingFormData) => {
    const property = enrichedProperty ?? selectedProperty;
    if (
      property?.status === 'RENTED' &&
      data.shouldPublish &&
      data.listingType === 'RENT'
    ) {
      if (!property.allowRentListingWhenRented) {
        toast.error(t('rentedPropertyRentDisabledError'));
        return;
      }
      if (!data.availableFrom) {
        toast.error(t('rentedPropertyAvailableFromRequired'));
        return;
      }
    }

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
    } catch (error) {
      handleErrorApi({ error, t: tGlobal });
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col px-4 pt-2 md:px-6 md:pt-3',
        currentStep === 1 ? 'min-h-0 flex-1 pb-4 md:pb-5' : 'pb-2 md:pb-3'
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-5xl flex-col',
          currentStep === 1 ? 'min-h-0 flex-1 overflow-hidden' : ''
        )}
      >
        {/* Header - Fixed */}
        <div className='shrink-0'>
          <div className='px-0 md:px-2 pt-0'>
            <button
              type='button'
              onClick={() => router.back()}
              className='mb-1 flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2'
            >
              <ArrowLeft className='size-4' />
              <span>{t('goBack')}</span>
            </button>
            <div className='mx-auto max-w-xl space-y-1.5 text-center'>
              <h1 className='text-lg font-bold leading-snug tracking-tight text-foreground md:text-xl'>
                {t('title')}
              </h1>
              <p className='text-xs leading-relaxed text-muted-foreground/70 md:text-sm'>
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className='mt-2 flex justify-center border-b border-primary/20 px-2 pb-2 md:pb-3'>
            <StepIndicator currentStep={currentStep} />
          </div>
        </div>

        {/* Step 1: Property Selection */}
        {currentStep === 1 && (
          <>
            {/* Single inner scroll: fills space between header and footer so main does not scroll */}
            <div className='flex min-h-0 flex-1 flex-col overflow-hidden py-4 md:py-5'>
              <h3 className='mb-3 shrink-0 text-base font-bold leading-snug tracking-tight text-foreground'>
                {t('selectProperty')}
              </h3>

              {isLoading ? (
                <div className='flex min-h-0 flex-1 items-center justify-center py-8'>
                  <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
                </div>
              ) : properties.length === 0 ? (
                <div className='flex min-h-0 flex-1 flex-col items-center justify-center gap-4 py-8 text-center'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
                    <Home className='h-6 w-6 text-primary' strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-foreground'>
                      {t('noProperties')}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {t('noPropertiesDesc')}
                    </p>
                  </div>
                  <Link
                    href='/dashboard/property/create'
                    className='flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90'
                  >
                    <Plus className='h-4 w-4' strokeWidth={2.5} />
                    {t('createPropertyCta')}
                  </Link>
                </div>
              ) : (
                <>
                  <div className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 [-webkit-overflow-scrolling:touch]'>
                    <div className='flex flex-col gap-3'>
                      {properties.map((property) => (
                        <PropertyCard
                          key={property.propertyId}
                          property={property}
                          isSelected={selectedProperty?.propertyId === property.propertyId}
                          onSelect={() => setSelectedProperty(property)}
                        />
                      ))}
                    </div>
                  </div>

                  {hasNextPage ? (
                    <div className='mt-3 flex shrink-0 justify-center'>
                      <button
                        type='button'
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className={cn(
                          'rounded-lg border border-primary/30 bg-primary/5 px-5 py-2 text-sm font-semibold text-primary transition-colors',
                          'hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60'
                        )}
                      >
                        {isFetchingNextPage ? t('loadMoreLoading') : t('loadMore')}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Footer — Next button - Fixed */}
            <div className='flex shrink-0 justify-end border-t border-primary/20 py-3 md:py-4'>
              <button
                type='button'
                disabled={!selectedProperty}
                onClick={handleNextStep}
                className={cn(
                  'flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-[15px] font-semibold transition-all sm:w-auto sm:min-w-[128px]',
                  selectedProperty
                    ? 'bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90'
                    : 'cursor-not-allowed bg-primary/30 text-white'
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
            nestedInScrollableRoute
          />
        )}
      </div>
    </div>
  );
}
