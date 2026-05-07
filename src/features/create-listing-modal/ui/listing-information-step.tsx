'use client';

import * as React from 'react';
import { Home, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import type { UserProperty, ListingType, CreateListingFormData } from '../model/types';
import { Check } from 'lucide-react';
import { useContentVerification } from '@/shared/lib/hooks/use-content-verification';
import { useMediaAnalysis } from '@/shared/lib/hooks/use-media-analysis';
import { useListingQuota } from '@/entities/billing';
import type { PropertyPriceRange } from '@/entities/property/api/property-api.types';
import { formatNumber } from '@/shared/lib/utils/format-currency';
import {
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
import { Switch } from '@/shared/ui/switch';

function formatEnMoneyLong(n: number): string {
  return `${n.toLocaleString('en-US')} VND`;
}

function formatViMoneyLong(n: number): string {
  return `${formatNumber(n)} đồng`;
}

function formatOwnerPriceBand(
  band: { min?: number | null; max?: number | null } | undefined,
  locale: string
): string | null {
  if (!band) return null;
  const min = band.min;
  const max = band.max;
  const hasMin = min != null && Number.isFinite(Number(min)) && Number(min) > 0;
  const hasMax = max != null && Number.isFinite(Number(max)) && Number(max) > 0;
  if (!hasMin && !hasMax) return null;
  const nMin = hasMin ? Number(min) : NaN;
  const nMax = hasMax ? Number(max) : NaN;
  const fmt = (n: number) => (locale === 'vi' ? formatViMoneyLong(n) : formatEnMoneyLong(n));
  if (hasMin && hasMax && nMin === nMax) return fmt(nMin);
  if (hasMin && hasMax) return `${fmt(nMin)} – ${fmt(nMax)}`;
  if (hasMin) return fmt(nMin);
  return fmt(nMax);
}

function ownerPriceBandForListingType(
  priceRange: PropertyPriceRange | null | undefined,
  listingType: ListingType,
  locale: string
): string | null {
  if (!priceRange) return null;
  const band = listingType === 'RENT' ? priceRange.rent : priceRange.buy;
  return formatOwnerPriceBand(band, locale);
}

interface ListingInformationStepProps {
  selectedProperty: UserProperty;
  onPrevious: () => void;
  onSubmit: (data: CreateListingFormData) => void;
  isSubmitting?: boolean;
  /**
   * Use on full-screen routes whose outer main already scrolls. Avoids stretching the inner
   * scroll pane (flex-1) which creates a large empty band above the footer on short forms.
   */
  nestedInScrollableRoute?: boolean;
}

function ReadOnlyField({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <span className='text-xs font-medium text-foreground'>{label}</span>
      <div className='flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2'>
        <span className='flex-1 text-xs text-muted-foreground leading-snug'>{value}</span>
        {badge && (
          <span className='rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary'>
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
  nestedInScrollableRoute = false,
}: ListingInformationStepProps) {
  const t = useTranslations('CreateListingModal');
  const locale = useLocale();
  const { remaining, unlimited, isLocked, isLoading: quotaLoading } = useListingQuota();

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
  const {
    analysisStatus,
    analyzeFile,
    appendEntries,
    removeEntry,
    QUALITY_THRESHOLD,
  } = useMediaAnalysis();

  /** Per-file check so an empty `analysisStatus` cannot satisfy vacuous `every()` while `newFiles` has images. */
  const newImageAiGate = React.useMemo(() => {
    let pending = false;
    let allPassed = true;
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (!file.type.startsWith('image/')) continue;
      const s = analysisStatus[i];
      if (!s || s.isLoading || (!s.result && !s.error)) {
        pending = true;
        allPassed = false;
        continue;
      }
      if (s.error || !s.result || (s.result.finalScore ?? 100) < QUALITY_THRESHOLD) {
        allPassed = false;
      }
    }
    return { pending, allPassed };
  }, [newFiles, analysisStatus, QUALITY_THRESHOLD]);

  // ── Form State ──
  /** Switch UI owns Thuê ↔ Bán; `listingType` is derived (avoids shared handler with radios). */
  const [listingTradeIsSale, setListingTradeIsSale] = React.useState(false);
  const listingType: ListingType = listingTradeIsSale ? 'SALE' : 'RENT';
  const [name, setName] = React.useState('');
  const [content, setContent] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [isNegotiable, setIsNegotiable] = React.useState(false);
  const [availableFrom, setAvailableFrom] = React.useState('');
  const [securityDeposit, setSecurityDeposit] = React.useState('');

  const handleListingTradeSwitchChange = React.useCallback((checked: boolean) => {
    setListingTradeIsSale(checked);
  }, []);

  const listingTypeLayoutAnchorRef = React.useRef<HTMLDivElement>(null);
  /** Dialog / step scrollport when not nested in an outer scrolling route */
  const listingStepScrollBodyRef = React.useRef<HTMLDivElement>(null);
  /** Observed for height changes after RENT ↔ SALE, zoom, fonts, media layout */
  const listingStepScrollContentRef = React.useRef<HTMLDivElement>(null);
  const isInitialListingTypeLayoutEffect = React.useRef(true);

  const { contentStatus, isContentValid } = useContentVerification(name, content);

  const clampOverflowScrollPositions = React.useCallback(() => {
    const clampEl = (scrollEl: HTMLElement) => {
      const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
      if (scrollEl.scrollTop > maxScroll) scrollEl.scrollTop = maxScroll;
    };

    const body = listingStepScrollBodyRef.current;
    if (body) clampEl(body);

    // Full-page / dashboard layouts often scroll `document`; dialog step uses `listingStepScrollBodyRef` instead.
    if (nestedInScrollableRoute && typeof document !== 'undefined') {
      const se = document.scrollingElement;
      if (se instanceof HTMLElement) clampEl(se);
    }

    const anchor = listingTypeLayoutAnchorRef.current;
    if (!anchor) return;
    let el: HTMLElement | null = anchor.parentElement;
    while (el) {
      const { overflowY } = window.getComputedStyle(el);
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
        clampEl(el);
      }
      el = el.parentElement;
    }
  }, [nestedInScrollableRoute]);

  // RENT ↔ SALE removes/adds rows (deposit, dates), so scroll height changes. Prefer clamping scroll
  // position over scrollIntoView — the latter often fights nested scroll ports and leaves a large
  // blank band inside the scrolling region (dashboard main or dialog body).
  React.useLayoutEffect(() => {
    if (isInitialListingTypeLayoutEffect.current) {
      isInitialListingTypeLayoutEffect.current = false;
      return;
    }
    clampOverflowScrollPositions();
    requestAnimationFrame(() => {
      clampOverflowScrollPositions();
      requestAnimationFrame(() => {
        clampOverflowScrollPositions();
      });
    });
  }, [listingTradeIsSale, clampOverflowScrollPositions]);

  React.useEffect(() => {
    const observed = listingStepScrollContentRef.current;
    if (!observed) return;
    const ro = new ResizeObserver(() => {
      clampOverflowScrollPositions();
    });
    ro.observe(observed);
    return () => ro.disconnect();
  }, [clampOverflowScrollPositions]);

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
        attr.dataType !== 'BOOLEAN' && (attr.valueNumber !== null || attr.valueText !== null)
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

    // Name (required)
    if (!name.trim()) errs.name = t('validation.nameRequired');
    else if (name.trim().length > 500) errs.name = t('validation.nameTooLong');

    // Content (optional, but limited)
    if (content.length > 2000) errs.content = t('validation.contentTooLong');

    // Price (required)
    if (!price.trim()) errs.price = t('validation.priceRequired');
    else if (isNaN(Number(price)) || Number(price) <= 0) errs.price = t('validation.priceInvalid');

    // Min / Max — only when negotiable; otherwise synced to main price in ListingPriceFields.
    if (isNegotiable) {
      const hasMin = minPrice.trim() !== '';
      const hasMax = maxPrice.trim() !== '';

      if (hasMin && (isNaN(Number(minPrice)) || Number(minPrice) <= 0))
        errs.minPrice = t('validation.minPriceInvalid');

      if (hasMax && (isNaN(Number(maxPrice)) || Number(maxPrice) <= 0))
        errs.maxPrice = t('validation.maxPriceInvalid');
      else if (hasMax && !errs.maxPrice && hasMin && !errs.minPrice && Number(minPrice) > Number(maxPrice))
        errs.maxPrice = t('validation.maxPriceLessThanMin');

      if (hasMin && !hasMax && !errs.minPrice) errs.maxPrice = t('validation.minMaxPairRequired');
      if (hasMax && !hasMin && !errs.maxPrice) errs.minPrice = t('validation.minMaxPairRequired');
    }

    // Date
    if (listingType === 'RENT' && availableFrom) {
      const d = new Date(availableFrom);
      if (isNaN(d.getTime())) errs.availableFrom = t('validation.dateInvalid');
    }

    return errs;
  }, [name, content, price, minPrice, maxPrice, availableFrom, listingType, isNegotiable, t]);

  React.useEffect(() => {
    if (hasAttemptedSubmit) setErrors(validate());
  }, [hasAttemptedSubmit, validate]);

  const handleSubmit = (shouldPublish: boolean = false) => {
    setHasAttemptedSubmit(true);
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    // Gate on AI/media checks only after field validation passes
    if (!canSubmit) return;

    const formData: CreateListingFormData = {
      propertyId: selectedProperty.propertyId,
      listingType,
      name,
      price,
      minPrice,
      maxPrice,
      isNegotiable,
      availableFrom,
      securityDeposit,
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

  // canSubmit: only gate on AI/media conditions that can't be shown inline.
  // Field errors (name, price, etc.) are surfaced via validate() on submit click.
  const hasMedia = selectedMediaIds.size > 0 || selectedNewFileIndices.size > 0;
  const canSubmit =
    hasMedia &&
    !newImageAiGate.pending &&
    newImageAiGate.allPassed &&
    isContentValid &&
    !isSubmitting;

  // ── Translation labels for shared components ──
  const priceLabels = {
    priceRent: t('priceRent'),
    priceSale: t('priceSale'),
    pricePlaceholder: t('pricePlaceholder'),
    securityDeposit: t('securityDeposit'),
    minPrice: t('minPrice'),
    maxPrice: t('maxPrice'),
    negotiable: t('negotiable'),
    priceRangeHint: t('priceRangeHint'),
  };

  const propertyOwnerPriceHint = React.useMemo(() => {
    const bandText = ownerPriceBandForListingType(
      selectedProperty.priceRange,
      listingType,
      locale
    );
    if (!bandText) return null;
    return listingType === 'RENT'
      ? t('ownerExpectedPriceRent', { price: bandText })
      : t('ownerExpectedPriceSale', { price: bandText });
  }, [selectedProperty.priceRange, listingType, locale, t]);

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
      {/* Scrollable content — in dialogs flex-1+overflow-y-auto fills the dialog's max-height;
           on full-page routes flex-1 (no overflow) pushes the sticky footer to the bottom */}
      <div
        ref={nestedInScrollableRoute ? undefined : listingStepScrollBodyRef}
        className={cn(
          'px-4 md:px-8 [overflow-anchor:none]',
          nestedInScrollableRoute
            ? 'pt-4 md:pt-5 pb-2 md:pb-3'
            : 'min-h-0 flex-1 overflow-y-auto py-4 md:py-5'
        )}
      >
        <div ref={listingStepScrollContentRef} className='min-w-0'>
        {/* Selected property + address + read-only profile fields */}
        <div className='rounded-xl border-[1.5px] border-primary/20 p-3 md:p-4 shadow-primary/10'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10'>
              <Home className='h-4 w-4 text-primary' />
            </div>
            <div className='flex min-w-0 flex-col gap-0.5'>
              <span className='text-base font-bold leading-snug tracking-tight text-foreground'>
                {t('selectedPropertyCardTitle')}
              </span>
              <span className='flex items-start gap-1 text-xs leading-snug text-muted-foreground/70'>
                <MapPin className='mt-0.5 h-3 w-3 shrink-0' />
                <span className='min-w-0'>{fullAddress}</span>
              </span>
            </div>
          </div>

          {selectedProperty.amenities.length > 0 && (
            <div className='mt-4 flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-foreground'>{t('selectAmenities')}</span>
                <span className='rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary'>
                  {t('readOnly')}
                </span>
              </div>
              <div className='rounded-lg border border-primary/20 p-3'>
                <div className='flex flex-wrap gap-1.5'>
                  {selectedProperty.amenities.map((amenity) => (
                    <div
                      key={amenity.amenityId}
                      className='flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-foreground/80'
                    >
                      <Check className='h-3 w-3 text-primary' strokeWidth={2.5} />
                      {amenity.amenityName}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className='mt-4 border-t border-primary/10 pt-4'>
            <ReadOnlyField
              label={t('propertyType')}
              value={selectedProperty.propertyType.propertyTypeName}
              badge={t('readOnly')}
            />
            <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3'>
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
              {selectedProperty.widthM != null &&
                selectedProperty.lengthM != null &&
                selectedProperty.widthM > 0 &&
                selectedProperty.lengthM > 0 && (
                  <ReadOnlyField
                    label={t('dimensions', { fallback: 'Dimensions' })}
                    value={`${selectedProperty.widthM}m × ${selectedProperty.lengthM}m`}
                    badge={t('readOnly')}
                  />
                )}
            </div>
          </div>
        </div>

        {/* Listing Information Form */}
        <div className='mt-4 rounded-xl border-[1.5px] border-primary/20 p-3 md:p-4'>
          <h3 className='mb-4 text-lg font-bold tracking-tight text-foreground'>
            {t('listingInformation')}
          </h3>

          <div className='flex flex-col gap-4'>
            {/* Listing Name */}
            <ListingNameInput
              value={name}
              onChange={setName}
              label={t('listingName')}
              placeholder={t('listingNamePlaceholder')}
              error={errors.name}
              compact
            />

            {/* Listing Content */}
            <ListingContentTextarea
              value={content}
              onChange={setContent}
              label={t('listingContent')}
              placeholder={t('listingContentPlaceholder')}
              error={errors.content}
              compact
            />

            {/* Content Verification */}
            <ContentVerificationStatusPanel
              hasContent={!!(name.trim() || content.trim())}
              status={contentStatus}
              compact
              labels={{
                title: t('aiAnalysis.contentVerification'),
                verified: t('aiAnalysis.verified'),
                violated: t('aiAnalysis.violated'),
              }}
            />

            {/* Listing Type — Switch (Thuê off / Bán on); state + handler isolated from radios */}
            <div ref={listingTypeLayoutAnchorRef} className='flex flex-col gap-2'>
              <span className='text-xs font-medium text-foreground'>
                {t('listingTypeLabel')}
                <span className='text-primary'>*</span>
              </span>
              <div className='flex flex-wrap items-center gap-3 sm:gap-4'>
                <span
                  className={cn(
                    'text-xs min-w-[72px]',
                    !listingTradeIsSale ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {t('listingTypeRent')}
                </span>
                <Switch
                  checked={listingTradeIsSale}
                  onCheckedChange={handleListingTradeSwitchChange}
                  aria-label={`${t('listingTypeRent')} / ${t('listingTypeSale')}`}
                />
                <span
                  className={cn(
                    'text-xs min-w-[56px]',
                    listingTradeIsSale ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {t('listingTypeSale')}
                </span>
              </div>
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
              securityDeposit={securityDeposit}
              onSecurityDepositChange={setSecurityDeposit}
              errors={errors}
              labels={priceLabels}
              compact
              propertyOwnerPriceHint={propertyOwnerPriceHint}
            />

            {/* Date Available */}
            {listingType === 'RENT' && (
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3'>
                <ListingDateField
                  value={availableFrom}
                  onChange={setAvailableFrom}
                  label={t('dateAvailable')}
                  error={errors.availableFrom}
                  compact
                />
              </div>
            )}

            {/* Media Section */}
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-foreground'>{t('mediaUpload')}</span>
                {selectedProperty.media.filter((m) => m.isPropertyStandard).length > 0 && (
                  <span className='text-xs text-muted-foreground/70'>
                    {selectedMediaIds.size} /{' '}
                    {selectedProperty.media.filter((m) => m.isPropertyStandard).length}{' '}
                    {t('selected', { fallback: 'selected' })}
                  </span>
                )}
              </div>
              <p className='text-[11px] leading-snug text-muted-foreground/70'>{t('mediaUploadHint')}</p>

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
                compact
                labels={{
                  dragAndDrop: t('dragAndDrop'),
                  uploadHint: t('uploadHint', { fallback: 'JPG, PNG, MP4 supported' }),
                }}
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Footer — Previous / Save as Draft / Submit */}
      <div
        className={cn(
          'shrink-0 border-t border-primary/20',
          nestedInScrollableRoute ? 'py-2.5 md:py-3' : 'py-3 md:py-4'
        )}
      >
        {/* Quota info */}
        <div className='mb-2 text-right'>
          {quotaLoading ? (
            <span className='text-xs text-grey-500'>{t('quota.loading')}</span>
          ) : unlimited ? (
            <span className='text-xs font-medium text-green-600'>{t('quota.unlimited')}</span>
          ) : isLocked ? (
            <span className='text-xs font-medium text-red-500'>{t('quota.exhausted')}</span>
          ) : (
            <span className='text-xs text-grey-600'>
              {t('quota.remaining', { count: remaining ?? 0 })}
            </span>
          )}
        </div>

        <div className='flex flex-wrap items-center justify-end gap-2 sm:gap-3'>
          <button
            type='button'
            onClick={onPrevious}
            disabled={isSubmitting}
            className='mr-auto flex items-center justify-center rounded-lg bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50'
          >
            {t('previous')}
          </button>

          <button
            type='button'
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className={cn(
              'flex items-center justify-center rounded-lg border-2 px-5 py-2.5 text-sm font-semibold transition-all',
              !isSubmitting
                ? 'border-primary text-primary hover:bg-primary/5'
                : 'cursor-not-allowed border-primary/20 text-primary/20'
            )}
          >
            {t('saveAsDraft', { fallback: 'Save as Draft' })}
          </button>

          <button
            type='button'
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || isLocked || newImageAiGate.pending}
            className={cn(
              'flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all sm:min-w-[128px]',
              !isSubmitting && !isLocked && !newImageAiGate.pending
                ? 'bg-primary shadow-sm shadow-primary/20 hover:bg-primary/90'
                : 'cursor-not-allowed bg-primary/30'
            )}
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>
    </>
  );
}
