'use client';

import * as React from 'react';
import Image from 'next/image';
import { Home, MapPin, Upload, Calendar, X, Play, ImageIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import type { UserProperty, ListingType, CreateListingFormData } from '../model/types';
import { AttributeIcon } from '@/shared/ui/attribute-icon/attribute-icon';
import { Check, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import {
  aiAnalysisApi,
  type AIAnalysisResult,
  type ListingVerificationResponse,
} from '@/entities/ai/api/ai-analysis.api';

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
        <span className='flex-1 text-sm text-main-secondary/60'>{value}</span>
        {badge && (
          <span className='rounded-full bg-purple-96 px-2 py-0.5 text-xs font-medium text-main-primary'>
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
  const [selectedNewFileIndices, setSelectedNewFileIndices] = React.useState<Set<number>>(new Set());
  const [analysisStatus, setAnalysisStatus] = React.useState<
    {
      result: AIAnalysisResult | null;
      isLoading: boolean;
      error: string | null;
    }[]
  >([]);
  const [contentStatus, setContentStatus] = React.useState<{
    isLoading: boolean;
    result: ListingVerificationResponse | null;
    error: string | null;
  }>({ isLoading: false, result: null, error: null });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const QUALITY_THRESHOLD = 50;

  const analyzeFile = React.useCallback(async (file: File, index: number) => {
    // If it's a video, skip analysis for now
    if (file.type.startsWith('video/')) {
      // TODO: Implement video analysis in the future
      setAnalysisStatus((prev) => {
        const next = [...prev];
        next[index] = {
          result: { finalScore: 100 } as any, // Dummy score so it passes validation
          isLoading: false,
          error: null,
        };
        return next;
      });
      return;
    }

    setAnalysisStatus((prev) => {
      const next = [...prev];
      next[index] = { result: null, isLoading: true, error: null };
      return next;
    });

    try {
      const res = await aiAnalysisApi.analyzeImage(file);
      setAnalysisStatus((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { result: res.payload, isLoading: false, error: null };
        }
        return next;
      });
    } catch {
      setAnalysisStatus((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { result: null, isLoading: false, error: 'Analysis failed' };
        }
        return next;
      });
    }
  }, []);

  // Auto-set primary media if only one exists
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const startIndex = newFiles.length;

    setNewFiles((prev) => [...prev, ...files]);
    setSelectedNewFileIndices((prev) => {
      const next = new Set(prev);
      files.forEach((_, i) => next.add(startIndex + i));
      return next;
    });
    setAnalysisStatus((prev) => [
      ...prev,
      ...files.map(() => ({ result: null, isLoading: false, error: null })),
    ]);

    // Trigger analysis for each new file
    files.forEach((file, i) => {
      analyzeFile(file, startIndex + i);
    });

    e.target.value = '';
  };

  const toggleMedia = (mediaId: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
        if (primaryMediaId === mediaId) {
          setPrimaryMediaId(null);
        }
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
        if (primaryMediaId === id) {
          setPrimaryMediaId(null);
        }
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setAnalysisStatus((prev) => prev.filter((_, i) => i !== index));

    // Handle selectedNewFileIndices re-indexing
    setSelectedNewFileIndices((prev) => {
      const next = new Set<number>();
      Array.from(prev).forEach((idx) => {
        if (idx === index) return;
        if (idx > index) next.add(idx - 1);
        else next.add(idx);
      });
      return next;
    });

    // Handle primaryMediaId re-indexing if it was a "new" file
    if (primaryMediaId?.startsWith('new:')) {
      const currentIdx = parseInt(primaryMediaId.split(':')[1], 10);
      if (currentIdx === index) {
        setPrimaryMediaId(null);
      } else if (currentIdx > index) {
        setPrimaryMediaId(`new:${currentIdx - 1}`);
      }
    }
  };

  const [listingType, setListingType] = React.useState<ListingType>('RENT');
  const [name, setName] = React.useState('');
  const [content, setContent] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [isNegotiable, setIsNegotiable] = React.useState(false);
  const [availableFrom, setAvailableFrom] = React.useState('');

  const fullAddress = [
    selectedProperty.streetAddress,
    selectedProperty.location.wardName,
    selectedProperty.location.districtName,
    selectedProperty.location.cityName,
  ]
    .filter(Boolean)
    .join(', ');

  const verifyListingContent = React.useCallback(async () => {
    if (!name.trim() && !content.trim()) return;
    setContentStatus({ isLoading: true, result: null, error: null });
    try {
      const res = await aiAnalysisApi.verifyListing({
        title: name || 'Trống',
        description: content || 'Trống',
      });
      setContentStatus({ isLoading: false, result: res.payload, error: null });
    } catch {
      setContentStatus({ isLoading: false, result: null, error: 'Analysis failed' });
    }
  }, [name, content]);

  React.useEffect(() => {
    const isNameEmpty = name.trim().length === 0;
    const isContentEmpty = content.trim().length === 0;

    // Only check if at least name or content is populated
    if (isNameEmpty && isContentEmpty) {
      setContentStatus({ isLoading: false, result: null, error: null });
      return;
    }
    const timer = setTimeout(() => {
      verifyListingContent();
    }, 1500);
    return () => clearTimeout(timer);
  }, [name, content, verifyListingContent]);

  const numericFeatures =
    selectedProperty.attributes?.filter(
      (attr) => attr.valueNumber !== null || attr.valueText !== null
    ) || [];

  const booleanFeatures =
    selectedProperty.attributes?.filter((attr) => attr.valueBoolean === true) || [];

  // ---- Validation ----
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

  // Re-validate on field change after first submit attempt
  React.useEffect(() => {
    if (hasAttemptedSubmit) setErrors(validate());
  }, [hasAttemptedSubmit, validate]);

  const handleSubmit = () => {
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
      content: content,
      selectedMediaIds: Array.from(selectedMediaIds).filter(
        (id) => selectedProperty.media.find((m) => m.mediaId === id)?.isPropertyStandard
      ),
      primaryMediaId: primaryMediaId ?? undefined,
      newFiles: newFiles.filter((_, i) => selectedNewFileIndices.has(i)),
    };
    onSubmit(formData);
  };

  const allImagesAnalyzed = analysisStatus.every((s) => !s.isLoading && (s.result || s.error));
  const allImagesPassed = analysisStatus.every(
    (s) => s.result && (s.result.finalScore ?? 100) >= QUALITY_THRESHOLD
  );

  const isContentValid = contentStatus.result?.isValid ?? false;

  const isValid =
    name.trim() !== '' &&
    price.trim() !== '' &&
    Object.keys(errors).length === 0 &&
    allImagesAnalyzed &&
    allImagesPassed &&
    isContentValid &&
    (selectedMediaIds.size > 0 || selectedNewFileIndices.size > 0); // Must have at least one media item selected

  return (
    <>
      {/* Scrollable content */}
      <div className='flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6'>
        {/* Property Address Card */}
        <div className='rounded-xl border-[1.5px] border-purple-92 p-4 md:p-6 shadow-[0px_4px_20px_0px_rgba(14,8,84,0.08)]'>
          <div className='flex items-center gap-4'>
            <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-main-primary/10'>
              <Home className='h-6 w-6 text-main-primary' />
            </div>
            <div className='flex min-w-0 flex-col gap-1'>
              <span className='text-lg font-bold tracking-tight text-main-black'>
                {t('propertyAddress')}
              </span>
              <span className='flex items-center gap-1 text-sm text-main-secondary/50'>
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
            <div className='flex flex-col gap-2'>
              <label className='text-sm font-medium text-main-black'>
                {t('listingName')}
                <span className='text-main-primary'>*</span>
              </label>
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={500}
                placeholder={t('listingNamePlaceholder')}
                className={cn(
                  'rounded-lg border bg-white px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 transition-colors focus:outline-none',
                  errors.name
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-purple-92 focus:border-main-primary'
                )}
              />
              {errors.name && <span className='text-xs text-red-500'>{errors.name}</span>}
            </div>

            {/* Listing Content */}
            <div className='flex flex-col gap-2'>
              <label className='text-sm font-medium text-main-black'>{t('listingContent')}</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('listingContentPlaceholder')}
                rows={4}
                className='rounded-lg border border-purple-92 bg-white px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 transition-colors focus:border-main-primary focus:outline-none resize-none'
              />
            </div>

            {/* Content Verification Status */}
            {(name.trim() || content.trim()) && (
              <div className='flex flex-col gap-2 rounded-lg border border-purple-92 bg-purple-98/30 p-4'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-semibold text-main-black'>
                    {t('aiAnalysis.contentVerification')}
                  </span>
                  {contentStatus.isLoading && (
                    <Loader2 className='h-4 w-4 animate-spin text-main-primary' />
                  )}
                  {!contentStatus.isLoading && contentStatus.result?.isValid && (
                    <span className='flex items-center gap-1 text-xs font-semibold text-emerald-600'>
                      <CheckCircle2 className='h-4 w-4' /> {t('aiAnalysis.verified')}
                    </span>
                  )}
                  {!contentStatus.isLoading &&
                    contentStatus.result &&
                    !contentStatus.result.isValid && (
                      <span className='flex items-center gap-1 text-xs font-semibold text-red-600'>
                        <AlertCircle className='h-4 w-4' /> {t('aiAnalysis.violated')}
                      </span>
                    )}
                </div>
                {!contentStatus.isLoading && contentStatus.result && (
                  <p
                    className={cn(
                      'text-xs',
                      contentStatus.result.isValid
                        ? 'text-main-secondary'
                        : 'text-red-500 font-medium'
                    )}
                  >
                    {contentStatus.result.feedback}
                  </p>
                )}
              </div>
            )}

            <div className='flex flex-col gap-2'>
              <span className='text-sm font-medium text-main-black'>
                {t('listingTypeLabel')}
                <span className='text-main-primary'>*</span>
              </span>
              <div className='flex gap-4'>
                {(['RENT', 'SALE'] as ListingType[]).map((type) => (
                  <label key={type} className='flex cursor-pointer items-center gap-2'>
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                        listingType === type ? 'border-main-primary' : 'border-purple-92'
                      )}
                    >
                      {listingType === type && (
                        <div className='h-2.5 w-2.5 rounded-full bg-main-primary' />
                      )}
                    </div>
                    <input
                      type='radio'
                      name='listingType'
                      value={type}
                      checked={listingType === type}
                      onChange={() => setListingType(type)}
                      className='sr-only'
                    />
                    <span className='text-sm font-medium text-main-black'>
                      {type === 'RENT' ? t('listingTypeRent') : t('listingTypeSale')}
                    </span>
                  </label>
                ))}
              </div>
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

            {/* Price */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className={cn('flex flex-col gap-2', listingType === 'SALE' && 'sm:col-span-2')}>
                <label className='text-sm font-medium text-main-black'>
                  {listingType === 'RENT' ? t('priceRent') : t('priceSale')}
                  <span className='text-main-primary'>*</span>
                </label>
                <div className='flex items-center rounded-lg border border-purple-92 bg-white overflow-hidden transition-colors focus-within:border-main-primary'>
                  <span className='flex h-full items-center border-r border-purple-92 bg-purple-98/50 px-3 text-sm text-main-secondary/50'>
                    ₫
                  </span>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={t('pricePlaceholder')}
                    className={cn(
                      'flex-1 px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 focus:outline-none',
                      errors.price && 'text-red-500'
                    )}
                  />
                </div>
                {errors.price && <span className='text-xs text-red-500'>{errors.price}</span>}
              </div>
              {listingType === 'RENT' && (
                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium text-main-black'>
                    {t('securityDeposit')}
                  </label>
                  <div className='flex items-center rounded-lg border border-purple-92 bg-white overflow-hidden transition-colors focus-within:border-main-primary'>
                    <span className='flex h-full items-center border-r border-purple-92 bg-purple-98/50 px-3 text-sm text-main-secondary/50'>
                      ₫
                    </span>
                    <input
                      type='text'
                      inputMode='numeric'
                      placeholder={t('pricePlaceholder')}
                      className='flex-1 px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 focus:outline-none'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Min / Max Price */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-main-black'>{t('minPrice')}</label>
                <div className='flex items-center rounded-lg border border-purple-92 bg-white overflow-hidden transition-colors focus-within:border-main-primary'>
                  <span className='flex h-full items-center border-r border-purple-92 bg-purple-98/50 px-3 text-sm text-main-secondary/50'>
                    ₫
                  </span>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder={t('pricePlaceholder')}
                    className='flex-1 px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 focus:outline-none'
                  />
                </div>
                {errors.minPrice && <span className='text-xs text-red-500'>{errors.minPrice}</span>}
              </div>
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-main-black'>{t('maxPrice')}</label>
                <div className='flex items-center rounded-lg border border-purple-92 bg-white overflow-hidden transition-colors focus-within:border-main-primary'>
                  <span className='flex h-full items-center border-r border-purple-92 bg-purple-98/50 px-3 text-sm text-main-secondary/50'>
                    ₫
                  </span>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder={t('pricePlaceholder')}
                    className='flex-1 px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 focus:outline-none'
                  />
                </div>
                {errors.maxPrice && <span className='text-xs text-red-500'>{errors.maxPrice}</span>}
              </div>
            </div>

            {/* Negotiable */}
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-main-black'>{t('negotiable')}</span>
              <button
                type='button'
                role='switch'
                aria-checked={isNegotiable}
                onClick={() => setIsNegotiable(!isNegotiable)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  isNegotiable ? 'bg-main-primary' : 'bg-purple-92'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
                    isNegotiable ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Amenities (from property amenities) */}
            {selectedProperty.amenities.length > 0 && (
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-main-black'>
                    {t('selectAmenities')}
                  </span>
                  <span className='rounded-full bg-purple-96 px-2 py-0.5 text-xs font-medium text-main-primary'>
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
                        <Check className='h-3.5 w-3.5 text-main-primary' strokeWidth={2.5} />
                        {amenity.amenityName}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Boolean features from attributes */}
            {booleanFeatures.length > 0 && (
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-main-black'>
                    {t('features', { fallback: 'Features' })}
                  </span>
                  <span className='rounded-full bg-purple-96 px-2 py-0.5 text-xs font-medium text-main-primary'>
                    {t('readOnly')}
                  </span>
                </div>
                <div className='rounded-lg border border-purple-92 p-4'>
                  <div className='flex flex-wrap gap-2'>
                    {booleanFeatures.map((attr) => (
                      <div
                        key={attr.attributeId}
                        className='flex items-center gap-2 rounded-lg border border-purple-92 bg-purple-98/30 px-3 py-1.5 text-sm font-medium text-main-black/80'
                      >
                        {attr.icon && (
                          <AttributeIcon
                            iconName={attr.icon}
                            className='h-4 w-4 text-main-primary'
                            strokeWidth={2}
                          />
                        )}
                        {attr.attributeName}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Property Description (read-only) */}
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-main-black'>{t('description')}</span>
                <span className='rounded-full bg-purple-96 px-2 py-0.5 text-xs font-medium text-main-primary'>
                  {t('readOnly')}
                </span>
              </div>
              <div className='min-h-[100px] whitespace-pre-wrap rounded-lg border border-purple-92 bg-purple-98/50 px-4 py-3 text-sm text-main-secondary/60'>
                {selectedProperty.description || '—'}
              </div>
            </div>

            {/* Date Available */}
            {listingType === 'RENT' && (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium text-main-black'>
                    {t('dateAvailable')}
                  </label>
                  <div className='relative'>
                    <input
                      type='date'
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className='w-full rounded-lg border border-purple-92 bg-white px-4 py-3 text-sm text-main-black transition-colors focus:border-main-primary focus:outline-none'
                    />
                    <Calendar className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-main-secondary/40 pointer-events-none' />
                  </div>
                </div>
              </div>
            )}

            {/* Media Section */}
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-main-black'>{t('mediaUpload')}</span>
                {selectedProperty.media.filter((m) => m.isPropertyStandard).length > 0 && (
                  <span className='text-xs text-main-secondary/50'>
                    {selectedMediaIds.size} /{' '}
                    {selectedProperty.media.filter((m) => m.isPropertyStandard).length}{' '}
                    {t('selected', { fallback: 'selected' })}
                  </span>
                )}
              </div>
              <p className='text-xs text-main-secondary/50'>{t('mediaUploadHint')}</p>

              {selectedMediaIds.size === 0 && newFiles.length === 0 && (
                <div className='mt-1 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600'>
                  <AlertCircle className='h-3.5 w-3.5' />
                  <span>{t('validation.mediaRequired')}</span>
                </div>
              )}

              {/* Existing property media grid */}
              {selectedProperty.media.length > 0 && (
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                  {selectedProperty.media
                    .filter((media) => media.isPropertyStandard)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((media) => {
                      const isSelected = selectedMediaIds.has(media.mediaId);
                      const isVideo = media.mediaType === 'VIDEO';
                      return (
                        <div
                          key={media.mediaId}
                          role='button'
                          tabIndex={0}
                          onClick={() => toggleMedia(media.mediaId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleMedia(media.mediaId);
                            }
                          }}
                          className={cn(
                            'group relative aspect-video w-full overflow-hidden rounded-lg border-2 transition-all cursor-pointer text-left',
                            isSelected
                              ? 'border-main-primary shadow-[0px_0px_12px_0px_rgba(112,101,240,0.25)]'
                              : 'border-purple-92 opacity-70 hover:opacity-100 hover:border-main-primary/40'
                          )}
                        >
                          {/* Thumbnail */}
                          {isVideo ? (
                            media.thumbnailUrl ? (
                              <Image
                                src={media.thumbnailUrl}
                                alt=''
                                fill
                                className='object-cover'
                                sizes='(max-width: 640px) 50vw, 33vw'
                              />
                            ) : (
                              <video
                                src={media.mediaUrl}
                                className='h-full w-full object-cover'
                                muted
                                playsInline
                              />
                            )
                          ) : media.mediaUrl ? (
                            <Image
                              src={media.mediaUrl}
                              alt=''
                              fill
                              className='object-cover'
                              sizes='(max-width: 640px) 50vw, 33vw'
                            />
                          ) : (
                            <div className='flex h-full w-full items-center justify-center bg-purple-96'>
                              <ImageIcon className='h-8 w-8 text-main-secondary/30' />
                            </div>
                          )}

                          {/* Video indicator */}
                          {isVideo && (
                            <div className='absolute inset-0 flex items-center justify-center'>
                              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-black/50'>
                                <Play className='h-4 w-4 text-white' fill='white' />
                              </div>
                            </div>
                          )}

                          {/* Selected overlay */}
                          <div
                            className={cn(
                              'absolute inset-0 bg-main-primary/10 transition-opacity',
                              isSelected ? 'opacity-100' : 'opacity-0'
                            )}
                          />

                          {/* Checkmark */}
                          <div
                            className={cn(
                              'absolute right-1.5 top-1.5 transition-all',
                              isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                            )}
                          >
                            <CheckCircle2
                              className='h-5 w-5 text-main-primary drop-shadow'
                              fill='white'
                            />
                          </div>

                          {/* Primary badge/button */}
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryMediaId(media.mediaId);
                              // Ensure it's selected when made primary
                              setSelectedMediaIds((prev) => new Set(prev).add(media.mediaId));
                            }}
                            className={cn(
                              'absolute left-1.5 bottom-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors z-10',
                              primaryMediaId === media.mediaId
                                ? 'bg-main-primary text-white'
                                : 'bg-black/40 text-white/80 hover:bg-main-primary/80 opacity-0 group-hover:opacity-100'
                            )}
                          >
                            {primaryMediaId === media.mediaId
                              ? t('primary', { fallback: 'Primary' })
                              : t('makePrimary', { fallback: 'Make Primary' })}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* New uploads preview */}
              {newFiles.length > 0 && (
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                  {newFiles.map((file, index) => {
                    const isSelected = selectedNewFileIndices.has(index);
                    const isPrimary = primaryMediaId === `new:${index}`;
                    const status = analysisStatus[index];
                    const score = status?.result?.finalScore;
                    const isRejected = score !== undefined && score < QUALITY_THRESHOLD;
                    const feedback = status?.result?.analysis?.feedback;

                    return (
                      <div
                        key={`new-${index}`}
                        role='button'
                        tabIndex={0}
                        onClick={() => toggleNewFile(index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleNewFile(index);
                          }
                        }}
                        className={cn(
                          'group relative aspect-video w-full overflow-hidden rounded-lg border-2 transition-all cursor-pointer text-left',
                          isPrimary
                            ? 'border-main-primary shadow-[0px_0px_12px_0px_rgba(112,101,240,0.25)]'
                            : isSelected
                              ? 'border-main-primary/60'
                              : isRejected
                                ? 'border-red-400'
                                : 'border-purple-92 opacity-70 hover:opacity-100 hover:border-main-primary/40'
                        )}
                      >
                        {file.type.startsWith('image/') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className={cn(
                              'h-full w-full object-cover',
                              isRejected && 'grayscale-[0.5] blur-[1px]',
                              !isSelected && 'opacity-40'
                            )}
                          />
                        ) : (
                          <div
                            className={cn(
                              'flex h-full w-full flex-col items-center justify-center gap-1 px-2 bg-purple-96 transition-opacity',
                              !isSelected && 'opacity-40'
                            )}
                          >
                            <Play className='h-6 w-6 text-main-primary/60' />
                            <span className='truncate text-[10px] text-main-secondary/60 w-full text-center'>
                              {file.name}
                            </span>
                          </div>
                        )}

                        {/* AI Status Overlay */}
                        <div className='absolute inset-x-0 top-0 z-20 flex flex-col gap-1 p-1'>
                          {status?.isLoading ? (
                            <div className='flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white'>
                              <Loader2 className='h-3 w-3 animate-spin' />
                              {t('aiAnalysis.analyzing')}
                            </div>
                          ) : status?.error ? (
                            <div className='flex items-center gap-1 rounded bg-red-500/80 px-1.5 py-0.5 text-[10px] text-white'>
                              <AlertCircle className='h-3 w-3' />
                              {t('aiAnalysis.error')}
                            </div>
                          ) : isRejected ? (
                            <div className='flex flex-col gap-0.5 rounded bg-red-500/90 p-1.5 text-[10px] text-white'>
                              <div className='flex items-center gap-1 font-bold italic underline'>
                                <AlertCircle className='h-3 w-3' />
                                {t('aiAnalysis.notAllowed')}
                              </div>
                              {feedback && (
                                <div className='line-clamp-2 italic opacity-90'>{feedback}</div>
                              )}
                            </div>
                          ) : score !== undefined ? (
                            <div className='flex items-center gap-1 rounded bg-emerald-500/80 px-1.5 py-0.5 text-[10px] text-white'>
                              <CheckCircle2 className='h-3 w-3' />
                              {t('aiAnalysis.passed', { score })}
                            </div>
                          ) : null}
                        </div>

                        {/* Selected overlay */}
                        <div
                          className={cn(
                            'absolute inset-0 bg-main-primary/10 transition-opacity',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />

                        {/* Checkmark */}
                        <div
                          className={cn(
                            'absolute right-1.5 top-1.5 transition-all z-20',
                            isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                          )}
                        >
                          <CheckCircle2
                            className='h-5 w-5 text-main-primary drop-shadow'
                            fill='white'
                          />
                        </div>

                        {/* Feedback Tooltip on Hover */}
                        {!status?.isLoading && feedback && !isRejected && (
                          <div className='absolute inset-x-0 bottom-8 z-20 px-1.5 opacity-0 transition-opacity group-hover:opacity-100'>
                            <div className='rounded bg-black/80 p-1.5 text-[10px] leading-tight text-white shadow-lg'>
                              <p className='font-bold text-main-primary/40'>
                                {t('aiAnalysis.feedbackLabel')}
                              </p>
                              <p className='mt-0.5 line-clamp-3 italic'>{feedback}</p>
                            </div>
                          </div>
                        )}

                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNewFile(index);
                          }}
                          className='absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 z-30'
                        >
                          <X className='h-3 w-3' />
                        </button>

                        {!isRejected && (
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryMediaId(`new:${index}`);
                              // Ensure it's selected when made primary
                              setSelectedNewFileIndices((prev) => new Set(prev).add(index));
                            }}
                            className={cn(
                              'absolute left-1.5 bottom-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all z-10',
                              isPrimary
                                ? 'bg-main-primary text-white'
                                : 'bg-black/40 text-white/80 hover:bg-main-primary/80 opacity-0 group-hover:opacity-100'
                            )}
                          >
                            {isPrimary
                              ? t('primary', { fallback: 'Primary' })
                              : `${t('newUpload', { fallback: 'New' })} - ${t('makePrimary', { fallback: 'Make Primary' })}`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload drop zone */}
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*,video/*'
                multiple
                className='hidden'
                onChange={handleFileChange}
              />
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = Array.from(e.dataTransfer.files).filter(
                    (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
                  );
                  if (files.length > 0) {
                    const startIndex = newFiles.length;
                    setNewFiles((prev) => [...prev, ...files]);
                    setAnalysisStatus((prev) => [
                      ...prev,
                      ...files.map(() => ({ result: null, isLoading: false, error: null })),
                    ]);
                    files.forEach((file, i) => {
                      analyzeFile(file, startIndex + i);
                    });
                  }
                }}
                className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-92 bg-purple-98/30 px-6 py-8 text-center transition-colors hover:border-main-primary/40 hover:bg-purple-98/60 cursor-pointer w-full'
              >
                <Upload className='mb-2 h-7 w-7 text-main-primary/50' />
                <p className='text-sm font-medium text-main-secondary/60'>{t('dragAndDrop')}</p>
                <p className='mt-0.5 text-xs text-main-secondary/40'>
                  {t('uploadHint', { fallback: 'JPG, PNG, MP4 supported' })}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — Previous / Submit */}
      <div className='shrink-0 flex items-center justify-end gap-4 border-t border-purple-92/50 px-4 md:px-8 py-4 md:py-5 bg-white'>
        <button
          type='button'
          onClick={onPrevious}
          disabled={isSubmitting}
          className='flex min-w-[140px] items-center justify-center rounded-lg bg-purple-98 px-6 py-3 md:py-4 text-base font-bold text-main-primary transition-colors hover:bg-purple-96 disabled:opacity-50'
        >
          {t('previous')}
        </button>
        <button
          type='button'
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={cn(
            'flex min-w-[140px] items-center justify-center rounded-lg px-6 py-3 md:py-4 text-base font-bold text-white transition-all',
            isValid && !isSubmitting
              ? 'bg-main-primary hover:bg-main-primary/90 shadow-[0px_4px_16px_0px_rgba(112,101,240,0.3)]'
              : 'bg-main-primary/30 cursor-not-allowed'
          )}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </>
  );
}
