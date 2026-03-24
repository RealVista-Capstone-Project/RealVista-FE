'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronRight, MapPin, Maximize2, Home, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { RealVistaPagination } from '@/shared/ui/realvista-pagination/realvista-pagination';
import type { UserProperty, RepresentingType } from '../model/types';
import { mockUserProperties } from '../model/mock-user-properties';

export interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PropertyStatusBadge({ status }: { status: UserProperty['status'] }) {
  const t = useTranslations('CreateListingModal');

  const statusConfig: Record<
    UserProperty['status'],
    { label: string; className: string }
  > = {
    DRAFT: {
      label: t('propertyStatus.draft'),
      className: 'bg-grey-100 text-grey-600',
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
  };

  const config = statusConfig[status];

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
          ? 'border-main-primary bg-purple-98 shadow-[0px_0px_20px_0px_rgba(112,101,240,0.15)]'
          : 'border-purple-92 bg-white hover:border-main-primary/40 hover:bg-purple-98/50'
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
          <div className='flex h-full w-full items-center justify-center bg-purple-96'>
            <Home className='h-6 w-6 text-main-secondary/40' />
          </div>
        )}
      </div>

      {/* Info */}
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <div className='flex items-center gap-2'>
          <span className='truncate text-sm font-bold leading-tight text-main-black'>
            {property.streetAddress}
          </span>
          <PropertyStatusBadge status={property.status} />
        </div>

        <div className='flex items-center gap-1 text-xs text-main-secondary/60'>
          <MapPin className='h-3 w-3 shrink-0' />
          <span className='truncate'>{fullAddress}</span>
        </div>

        <div className='flex flex-wrap items-center gap-3 text-xs text-main-secondary/60'>
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
            ? 'border-main-primary bg-main-primary'
            : 'border-purple-92 bg-white group-hover:border-main-primary/40'
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
                  ? 'bg-main-primary text-white'
                  : 'bg-purple-96 text-main-black'
              )}
            >
              {step.number}
            </div>
            <span
              className={cn(
                'text-sm md:text-base font-medium hidden sm:block',
                step.number <= currentStep
                  ? 'text-main-black'
                  : 'text-main-secondary/50'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <ChevronRight className='h-5 w-5 text-main-secondary/50' />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function CreateListingModal({ open, onOpenChange }: CreateListingModalProps) {
  const t = useTranslations('CreateListingModal');
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string | null>(null);
  const [representing, setRepresenting] = React.useState<RepresentingType>('landlord');
  const [currentPage, setCurrentPage] = React.useState(1);

  const ITEMS_PER_PAGE = 3;

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedPropertyId(null);
      setRepresenting('landlord');
      setCurrentPage(1);
    }
  }, [open]);

  const properties = mockUserProperties;
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);
  const paginatedProperties = properties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex flex-col max-h-[95vh] sm:max-h-[90vh] sm:max-w-5xl !max-w-[95vw] sm:!max-w-5xl overflow-hidden p-0'>
        {/* Header - Fixed */}
        <div className='shrink-0'>
          <DialogHeader className='space-y-3 px-4 md:px-8 pt-6 md:pt-8 pb-0 text-center'>
            <DialogTitle className='text-2xl md:text-[28px] font-bold leading-tight tracking-[-0.28px] text-main-black'>
              {t('title')}
            </DialogTitle>
            <DialogDescription className='mx-auto max-w-md text-sm md:text-base leading-relaxed text-main-secondary/50'>
              {t('subtitle')}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className='flex justify-center border-b border-purple-92/50 px-4 md:px-8 pb-4 md:pb-6 mt-4'>
            <StepIndicator currentStep={1} />
          </div>
        </div>

        {/* Scrollable content - Flex 1 */}
        <div className='flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6'>
          {/* Property Selection */}
          <div className='rounded-xl border-[1.5px] border-purple-92 p-4 md:p-6'>
            <h3 className='mb-4 text-lg font-bold leading-snug tracking-tight text-main-black'>
              {t('selectProperty')}
            </h3>

            <div className='flex flex-col gap-3'>
              {paginatedProperties.map((property) => (
                <PropertyCard
                  key={property.propertyId}
                  property={property}
                  isSelected={selectedPropertyId === property.propertyId}
                  onSelect={() => setSelectedPropertyId(property.propertyId)}
                />
              ))}
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

          {/* I'm representing */}
          <div className='mt-6 flex flex-col gap-4'>
            <div className='flex items-center gap-1'>
              <span className='text-sm font-medium text-main-black'>
                {t('representing.label')}
              </span>
              <span className='text-xs text-main-primary'>*</span>
            </div>
            <div className='flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10'>
              {/* Landlord */}
              <label className='flex cursor-pointer items-center gap-2'>
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                    representing === 'landlord'
                      ? 'border-main-primary'
                      : 'border-purple-92'
                  )}
                >
                  {representing === 'landlord' && (
                    <div className='h-3 w-3 rounded-full bg-main-primary' />
                  )}
                </div>
                <input
                  type='radio'
                  name='representing'
                  value='landlord'
                  checked={representing === 'landlord'}
                  onChange={() => setRepresenting('landlord')}
                  className='sr-only'
                />
                <span className='text-sm font-medium text-main-black'>
                  {t('representing.landlord')}
                </span>
              </label>

              {/* Applicant */}
              <label className='flex cursor-pointer items-center gap-2'>
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                    representing === 'applicant'
                      ? 'border-main-primary'
                      : 'border-purple-92'
                  )}
                >
                  {representing === 'applicant' && (
                    <div className='h-3 w-3 rounded-full bg-main-primary' />
                  )}
                </div>
                <input
                  type='radio'
                  name='representing'
                  value='applicant'
                  checked={representing === 'applicant'}
                  onChange={() => setRepresenting('applicant')}
                  className='sr-only'
                />
                <span className='text-sm font-medium text-main-black'>
                  {t('representing.applicant')}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer — Next button - Fixed */}
        <div className='shrink-0 flex justify-end border-t border-purple-92/50 px-4 md:px-8 py-4 md:py-5 bg-white'>
          <button
            type='button'
            disabled={!selectedPropertyId}
            className={cn(
              'flex w-full sm:min-w-[160px] sm:w-auto items-center justify-center rounded-lg px-8 py-3 md:py-4 text-base font-bold text-white transition-all',
              selectedPropertyId
                ? 'bg-main-primary hover:bg-main-primary/90 shadow-[0px_4px_16px_0px_rgba(112,101,240,0.3)]'
                : 'bg-main-primary/30 cursor-not-allowed'
            )}
          >
            {t('next')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
