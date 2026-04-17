'use client';

import * as React from 'react';
import { Home, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import type { UserProperty, ListingType, CreateListingFormData } from '../model/types';
import { Check } from 'lucide-react';
import { useContentVerification } from '@/shared/lib/hooks/use-content-verification';
import { useMediaAnalysis } from '@/shared/lib/hooks/use-media-analysis';
import {
  ListingTypeSelector,
  ListingNameInput,
  ListingContentTextarea,
  ContentVerificationStatusPanel,
  ListingPriceFields,
  ListingDateField,
  ExistingMediaGrid,
  NewFilesGrid,
  MediaUploadZone,
  type ExistingMediaItem,
} from '@/shared/ui/listing-form';

interface ListingInformationStepProps {
  selectedProperty: UserProperty;
  onPrevious: () => void;
  onSubmit: (data: CreateListingFormData) => void;
  isSubmitting?: boolean;
}

function ReadOnlyField({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className='flex flex-col gap-2'>
      <span className='text-sm font-medium text-main-black'>{label}</span>
      <div className='flex items-center gap-2 rounded-lg border border-purple-92 bg-purple-98/50 px-4 py-3'>
        <span className='flex-1 text-sm text-secondary/60'>{value}</span>
        {badge && (
          <span className='rounded-full bg-purple-96 px-2 py-0.5 text-xs font-medium text-primary'>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

export function ListingInformationStep({
  selectedProperty,
  onPrevious,
  onSubmit,
  isSubmitting = false,
}: ListingInformationStepProps) {
  const t = useTranslations('CreateListingModal');

  // ── Media Selection State ──
  const [selectedMediaIds, setSelectedMediaIds] = React.useState<Set<string>>(
    () => new Set(selectedProperty.media.filter((m) => m.isPropertyStandard).map((m) => m.mediaId))
  );
  const [primaryMediaId, setPrimaryMediaId] = React.useState<string | null>(
    () =>
      selectedProperty.media.find((m) => m.isPrimary && m.isPropertyStandard)?.mediaId ??
      selectedProperty.media.find((m) => m.isPropertyStandard)?.mediaId ??
      null
  );
  const [newFiles, setNewFiles] = React.useState<File[]>([]);
  const [selectedNewFileIndices, setSelectedNewFileIndices] = React.useState<Set<number>>(
    new Set()
  );

  // ── AI Hooks ──
  const { analysisStatus, analyzeFile, appendEntries, removeEntry, allImagesAnalyzed, allImagesPassed, QUALITY_THRESHOLD } = useMediaAnalysis();

  // ── Form State ──
  const [listingType, setListingType] = React.useState<ListingType>('RENT');
  const [name, setName] = React.useState('');
  const [content, setContent] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [isNegotiable, setIsNegotiable] = React.useState(false);
  const [availableFrom, setAvailableFrom] = React.useState('');

  const { contentStatus, isContentValid } = useContentVerification(name, content);

  // ── Auto-set primary media if only one exists ──
  React.useEffect(() => {
    const totalCount = selectedMediaIds.size + selectedNewFileIndices.size;
    if (totalCount === 1) {
      if (selectedMediaIds.size === 1) {
        const firstId = Array.from(selectedMediaIds)[0];
        if (primaryMediaId !== firstId) {
          setPrimaryMediaId(firstId);
        }
      } else if (selectedNewFileIndices.size === 1) {
        const firstIndex = Array.from(selectedNewFileIndices)[0];
        const newId = `new:${firstIndex}`;
        if (primaryMediaId !== newId) {
          setPrimaryMediaId(newId);
        }
      }
    }
  }, [selectedMediaIds, selectedNewFileIndices, primaryMediaId]);

  // ── Media Handlers ──
  const handleFilesSelected = (files: File[]) => {
    const startIndex = newFiles.length;
    setNewFiles((prev) => [...prev, ...files]);
    setSelectedNewFileIndices((prev) => {
      const next = new Set(prev);
      files.forEach((_, i) => next.add(startIndex + i));
      return next;
    });
    appendEntries(files.length);
    files.forEach((file, i) => {
      analyzeFile(file, startIndex + i);
    });
  };

  const toggleMedia = (mediaId: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
        if (primaryMediaId === mediaId) setPrimaryMediaId(null);
      } else {
        next.add(mediaId);
      }
      return next;
    });
  };

  const toggleNewFile = (index: number) => {
    setSelectedNewFileIndices((prev) => {
      const next = new Set(prev);
      const id = `new:${index}`;
      if (next.has(index)) {
        next.delete(index);
        if (primaryMediaId === id) setPrimaryMediaId(null);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    removeEntry(index);
    setSelectedNewFileIndices((prev) => {
      const next = new Set<number>();
      Array.from(prev).forEach((idx) => {
        if (idx === index) return;
        if (idx > index) next.add(idx - 1);
        else next.add(idx);
      });
      return next;
    });
    if (primaryMediaId?.startsWith('new:')) {
      const currentIdx = parseInt(primaryMediaId.split(':')[1], 10);
      if (currentIdx === index) setPrimaryMediaId(null);
      else if (currentIdx > index) setPrimaryMediaId(`new:${currentIdx - 1}`);
    }
  };

  const handleSetExistingPrimary = (mediaId: string) => {
    setPrimaryMediaId(mediaId);
    setSelectedMediaIds((prev) => new Set(prev).add(mediaId));
  };

  const handleSetNewPrimary = (id: string, index: number) => {
    setPrimaryMediaId(id);
    setSelectedNewFileIndices((prev) => new Set(prev).add(index));
  };

  // ── Derived Data ──
  const fullAddress = [
    selectedProperty.streetAddress,
    selectedProperty.location.wardName,
    selectedProperty.location.districtName,
    selectedProperty.location.cityName,
  ]
    .filter(Boolean)
    .join(', ');

  const numericFeatures =
    selectedProperty.attributes?.filter(
      (attr) =>
        attr.dataType !== 'BOOLEAN' &&
        (attr.valueNumber !== null || attr.valueText !== null)
    ) || [];

  const booleanFeatures =
    selectedProperty.attributes?.filter((attr) => attr.dataType === 'BOOLEAN') || [];

  const existingMediaItems: ExistingMediaItem[] = selectedProperty.media
    .filter((m) => m.isPropertyStandard)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((m) => ({
      id: m.mediaId,
      url: m.mediaUrl,
      thumbnailUrl: m.thumbnailUrl,
      type: m.mediaType,
      roomName: m.roomName,
    }));

  // ── Validation ──
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);

  const validate = React.useCallback(() => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('validation.nameRequired');
    else if (name.length > 500) errs.name = t('validation.nameTooLong');

    if (!price.trim()) errs.price = t('validation.priceRequired');
    else if (isNaN(Number(price)) || Number(price) <= 0) errs.price = t('validation.priceInvalid');

    if (!minPrice.trim()) errs.minPrice = t('validation.minPriceRequired');
    else if (isNaN(Number(minPrice)) || Number(minPrice) <= 0)
      errs.minPrice = t('validation.minPriceInvalid');

    if (!maxPrice.trim()) errs.maxPrice = t('validation.maxPriceRequired');
    else if (isNaN(Number(maxPrice)) || Number(maxPrice) <= 0)
      errs.maxPrice = t('validation.maxPriceInvalid');

    if (listingType === 'RENT' && availableFrom) {
      const d = new Date(availableFrom);
      if (isNaN(d.getTime())) errs.availableFrom = t('validation.dateInvalid');
    }

    return errs;
  }, [name, price, minPrice, maxPrice, availableFrom, listingType, t]);

  React.useEffect(() => {
    if (hasAttemptedSubmit) setErrors(validate());
  }, [hasAttemptedSubmit, validate]);

  const handleSubmit = (shouldPublish: boolean = false) => {
    setHasAttemptedSubmit(true);
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const formData: CreateListingFormData = {
      propertyId: selectedProperty.propertyId,
      listingType,
      name,
      price,
      minPrice,
      maxPrice,
      isNegotiable,
      availableFrom,
      content,
      selectedMediaIds: Array.from(selectedMediaIds).filter(
        (id) => selectedProperty.media.find((m) => m.mediaId === id)?.isPropertyStandard
      ),
      primaryMediaId: primaryMediaId ?? undefined,
      newFiles: newFiles.filter((_, i) => selectedNewFileIndices.has(i)),
      shouldPublish,
    };
    onSubmit(formData);
  };

  const isValid =
    name.trim() !== '' &&
    price.trim() !== '' &&
    Object.keys(errors).length === 0 &&
    allImagesAnalyzed &&
    allImagesPassed &&
    isContentValid &&
    (selectedMediaIds.size > 0 || selectedNewFileIndices.size > 0);

  // ── Translation labels for shared components ──
  const priceLabels = {
    priceRent: t('priceRent'),
    priceSale: t('priceSale'),
    pricePlaceholder: t('pricePlaceholder'),
    securityDeposit: t('securityDeposit'),
    minPrice: t('minPrice'),
    maxPrice: t('maxPrice'),
    negotiable: t('negotiable'),
  };

  const mediaLabels = {
    primary: t('primary', { fallback: 'Primary' }),
    makePrimary: t('makePrimary', { fallback: 'Make Primary' }),
    newUpload: t('newUpload', { fallback: 'New' }),
    analyzing: t('aiAnalysis.analyzing'),
    error: t('aiAnalysis.error'),
    notAllowed: t('aiAnalysis.notAllowed'),
    passed: t('aiAnalysis.passed', { score: '{score}' }),
    feedbackLabel: t('aiAnalysis.feedbackLabel'),
  };

  return (
    <>
      {/* Scrollable content */}
      <div className='flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6'>
        {/* Property Address Card */}
        <div className='rounded-xl border-[1.5px] border-primary/20 p-4 md:p-6 shadow-primary/10'>
          <div className='flex items-center gap-4'>
            <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10'>
              <Home className='h-6 w-6 text-primary' />
            </div>
            <div className='flex min-w-0 flex-col gap-1'>
              <span className='text-lg font-bold tracking-tight text-main-black'>
                {t('propertyAddress')}
              </span>
              <span className='flex items-center gap-1 text-sm text-secondary/50'>
                <MapPin className='h-3 w-3 shrink-0' />
                <span className='truncate'>{fullAddress}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Listing Information Form */}
        <div className='mt-5 rounded-xl border-[1.5px] border-purple-92 p-4 md:p-6'>
          <h3 className='mb-6 text-lg font-bold tracking-tight text-main-black'>
            {t('listingInformation')}
          </h3>

          <div className='flex flex-col gap-5'>
            {/* Listing Name */}
            <ListingNameInput
              value={name}
              onChange={setName}
              label={t('listingName')}
              placeholder={t('listingNamePlaceholder')}
              error={errors.name}
            />

            {/* Listing Content */}
            <ListingContentTextarea
              value={content}
              onChange={setContent}
              label={t('listingContent')}
              placeholder={t('listingContentPlaceholder')}
            />

            {/* Content Verification */}
            <ContentVerificationStatusPanel
              hasContent={!!(name.trim() || content.trim())}
              status={contentStatus}
              labels={{
                title: t('aiAnalysis.contentVerification'),
                verified: t('aiAnalysis.verified'),
                violated: t('aiAnalysis.violated'),
              }}
            />

            {/* Listing Type */}
            <div className='flex flex-col gap-2'>
              <span className='text-sm font-medium text-main-black'>
                {t('listingTypeLabel')}
                <span className='text-primary'>*</span>
              </span>
              <ListingTypeSelector
                value={listingType}
                onChange={setListingType}
                labels={{ rent: t('listingTypeRent'), sale: t('listingTypeSale') }}
              />
            </div>

            {/* Property Type (read-only) */}
            <ReadOnlyField
              label={t('propertyType')}
              value={selectedProperty.propertyType.propertyTypeName}
              badge={t('readOnly')}
            />

            {/* Property Attributes (dynamic) */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              {numericFeatures.map((attr) => (
                <ReadOnlyField
                  key={attr.attributeId}
                  label={attr.attributeName}
                  value={attr.displayValue ?? attr.valueText ?? attr.valueNumber?.toString() ?? '—'}
                  badge={t('readOnly')}
                />
              ))}
              {booleanFeatures.map((attr) => (
                <ReadOnlyField
                  key={attr.attributeId}
                  label={attr.attributeName}
                  value={attr.valueBoolean === true ? 'Có' : 'Không'}
                  badge={t('readOnly')}
                />
              ))}
              {selectedProperty.usableSizeM2 && (
                <ReadOnlyField
                  label={t('squareFeet')}
                  value={`${selectedProperty.usableSizeM2} m²${selectedProperty.areaSqft ? ` (${selectedProperty.areaSqft} sqft)` : ''}`}
                  badge={t('readOnly')}
                />
              )}
              {selectedProperty.landSizeM2 && (
                <ReadOnlyField
                  label={t('landSize', { size: '' }).replace(' m²', '').replace(':', '').trim()}
                  value={`${selectedProperty.landSizeM2} m²`}
                  badge={t('readOnly')}
                />
              )}
              {selectedProperty.widthM && selectedProperty.lengthM && (
                <ReadOnlyField
                  label={t('dimensions', { fallback: 'Dimensions' })}
                  value={`${selectedProperty.widthM}m × ${selectedProperty.lengthM}m`}
                  badge={t('readOnly')}
                />
              )}
            </div>

            {/* Pricing */}
            <ListingPriceFields
              listingType={listingType}
              price={price}
              onPriceChange={setPrice}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              isNegotiable={isNegotiable}
              onNegotiableChange={setIsNegotiable}
              errors={errors}
              labels={priceLabels}
            />

            {/* Amenities (from property amenities) */}
            {selectedProperty.amenities.length > 0 && (
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-main-black'>
                    {t('selectAmenities')}
                  </span>
                  <span className='rounded-full bg-purple-96 px-2 py-0.5 text-xs font-medium text-primary'>
                    {t('readOnly')}
                  </span>
                </div>
                <div className='rounded-lg border border-purple-92 p-4'>
                  <div className='flex flex-wrap gap-2'>
                    {selectedProperty.amenities.map((amenity) => (
                      <div
                        key={amenity.amenityId}
                        className='flex items-center gap-2 rounded-lg border border-purple-92 bg-purple-98/30 px-3 py-1.5 text-sm font-medium text-main-black/80'
                      >
                        <Check className='h-3.5 w-3.5 text-primary' strokeWidth={2.5} />
                        {amenity.amenityName}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Date Available */}
            {listingType === 'RENT' && (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <ListingDateField
                  value={availableFrom}
                  onChange={setAvailableFrom}
                  label={t('dateAvailable')}
                  error={errors.availableFrom}
                />
              </div>
            )}

            {/* Media Section */}
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-main-black'>{t('mediaUpload')}</span>
                {selectedProperty.media.filter((m) => m.isPropertyStandard).length > 0 && (
                  <span className='text-xs text-secondary/50'>
                    {selectedMediaIds.size} /{' '}
                    {selectedProperty.media.filter((m) => m.isPropertyStandard).length}{' '}
                    {t('selected', { fallback: 'selected' })}
                  </span>
                )}
              </div>
              <p className='text-xs text-secondary/50'>{t('mediaUploadHint')}</p>

              {selectedMediaIds.size === 0 && newFiles.length === 0 && (
                <div className='mt-1 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600'>
                  <AlertCircle className='h-3.5 w-3.5' />
                  <span>{t('validation.mediaRequired')}</span>
                </div>
              )}

              <ExistingMediaGrid
                items={existingMediaItems}
                selectedIds={selectedMediaIds}
                primaryId={primaryMediaId}
                onToggle={toggleMedia}
                onSetPrimary={handleSetExistingPrimary}
                labels={{
                  primary: mediaLabels.primary,
                  makePrimary: mediaLabels.makePrimary,
                }}
              />

              <NewFilesGrid
                files={newFiles}
                selectedIndices={selectedNewFileIndices}
                primaryId={primaryMediaId}
                analysisStatus={analysisStatus}
                qualityThreshold={QUALITY_THRESHOLD}
                onToggle={toggleNewFile}
                onRemove={removeNewFile}
                onSetPrimary={handleSetNewPrimary}
                labels={mediaLabels}
              />

              <MediaUploadZone
                onFilesSelected={handleFilesSelected}
                labels={{
                  dragAndDrop: t('dragAndDrop'),
                  uploadHint: t('uploadHint', { fallback: 'JPG, PNG, MP4 supported' }),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer — Previous / Save as Draft / Submit */}
      <div className='shrink-0 flex items-center justify-end gap-3 md:gap-4 border-t border-purple-92/50 px-4 md:px-8 py-4 md:py-5 bg-white'>
        <button
          type='button'
          onClick={onPrevious}
          disabled={isSubmitting}
          className='mr-auto flex min-w-[100px] md:min-w-[140px] items-center justify-center rounded-lg bg-purple-98 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-bold text-primary transition-colors hover:bg-purple-96 disabled:opacity-50'
        >
          {t('previous')}
        </button>

        <button
          type='button'
          onClick={() => handleSubmit(false)}
          disabled={!isValid || isSubmitting}
          className={cn(
            'flex min-w-[100px] md:min-w-[140px] items-center justify-center rounded-lg border-2 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-bold transition-all',
            isValid && !isSubmitting
              ? 'border-primary text-primary hover:bg-primary/5'
              : 'border-primary/20 text-primary/20 cursor-not-allowed'
          )}
        >
          {t('saveAsDraft', { fallback: 'Save as Draft' })}
        </button>

        <button
          type='button'
          onClick={() => handleSubmit(true)}
          disabled={!isValid || isSubmitting}
          className={cn(
            'flex min-w-[100px] md:min-w-[140px] items-center justify-center rounded-lg px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-bold text-white transition-all',
            isValid && !isSubmitting
              ? 'bg-primary hover:bg-primary/90 shadow-primary/30'
              : 'bg-primary/30 cursor-not-allowed'
          )}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </>
  );
}
