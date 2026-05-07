'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/shared/lib/utils';
import { mediaApi } from '@/entities/media/api/media.api';
import { useUpdateListing } from '../api/use-update-listing';
import type { EditListingPayload } from '../model/types';
import type { Listing, ListingType } from '@/entities/listing';
import { useContentVerification } from '@/shared/lib/hooks/use-content-verification';
import { useMediaAnalysis } from '@/shared/lib/hooks/use-media-analysis';
import { Spinner } from '@/shared/ui';
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

interface EditListingModalProps {
  listing: Listing;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditListingModal({ listing, isOpen, onOpenChange }: EditListingModalProps) {
  const t = useTranslations('CreateListingModal'); // Reuse translations
  const updateMutation = useUpdateListing();

  // ── Form State ──
  const [name, setName] = React.useState(listing.name);
  const [content, setContent] = React.useState(listing.content || '');
  const [listingType, setListingType] = React.useState<ListingType>(listing.listing_type);
  const [price, setPrice] = React.useState(listing.price.toString());
  const [minPrice, setMinPrice] = React.useState(listing.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = React.useState(listing.max_price?.toString() || '');
  const [isNegotiable, setIsNegotiable] = React.useState(listing.is_negotiable);
  const [availableFrom, setAvailableFrom] = React.useState(listing.available_from || '');
  const [securityDeposit, setSecurityDeposit] = React.useState(listing.security_deposit?.toString() ?? '');

  // ── Media State ──
  const initialMediaIds = new Set(listing.media?.map((m) => m.media_id) || []);
  const initialPrimary = listing.media?.find((m) => m.is_primary)?.media_id || null;
  const [selectedMediaIds, setSelectedMediaIds] = React.useState<Set<string>>(initialMediaIds);
  const [primaryMediaId, setPrimaryMediaId] = React.useState<string | null>(initialPrimary);
  const [newFiles, setNewFiles] = React.useState<File[]>([]);
  const [selectedNewFileIndices, setSelectedNewFileIndices] = React.useState<Set<number>>(
    new Set()
  );

  // ── AI Hooks ──
  const isNameChanged = name.trim() !== listing.name;
  const isContentChanged = content.trim() !== (listing.content || '');
  const needsContentVerify = isNameChanged || isContentChanged;

  const { contentStatus, isContentValid } = useContentVerification(name, content, {
    enabled: needsContentVerify,
  });
  const {
    analysisStatus,
    analyzeFile,
    appendEntries,
    removeEntry,
    allImagesAnalyzed,
    allImagesPassed,
    QUALITY_THRESHOLD,
  } = useMediaAnalysis();

  // ── Reset form when opened with a new listing ──
  React.useEffect(() => {
    if (isOpen) {
      setName(listing.name);
      setContent(listing.content || '');
      setListingType(listing.listing_type);
      setPrice(listing.price.toString());
      setMinPrice(listing.min_price?.toString() || '');
      setMaxPrice(listing.max_price?.toString() || '');
      setIsNegotiable(listing.is_negotiable);
      setAvailableFrom(listing.available_from || '');
      setSecurityDeposit(listing.security_deposit?.toString() ?? '');
      setSelectedMediaIds(new Set(listing.media?.map((m) => m.media_id) || []));
      setPrimaryMediaId(listing.media?.find((m) => m.is_primary)?.media_id || null);
      setNewFiles([]);
      setSelectedNewFileIndices(new Set());
      setErrors({});
    }
  }, [isOpen, listing]);

  // ── Media Handlers ──
  const toggleMedia = (mediaId: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
        if (primaryMediaId === mediaId) setPrimaryMediaId(null);
      } else {
        if (next.size + newFiles.length >= 10) {
          toast.error(t('validation.maxMedia', { fallback: 'Maximum 10 media files allowed' }));
          return next;
        }
        next.add(mediaId);
      }
      return next;
    });
  };

  const handleFilesSelected = (files: File[]) => {
    if (selectedMediaIds.size + newFiles.length + files.length > 10) {
      toast.error(t('validation.maxMedia', { fallback: 'Maximum 10 media files allowed' }));
      return;
    }
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
  const existingMediaItems: ExistingMediaItem[] = (listing.media || []).map((m) => ({
    id: m.media_id,
    url: m.media_url,
    thumbnailUrl: m.thumbnail_url,
    type: m.media_type,
  }));

  // ── Validation ──
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);

  const validateForm = React.useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Name (required)
    if (!name.trim()) newErrors.name = t('validation.nameRequired');
    else if (name.trim().length > 500) newErrors.name = t('validation.nameTooLong');

    // Content (optional, but limited)
    if (content.length > 2000) newErrors.content = t('validation.contentTooLong');

    // Price (required)
    if (!price.trim()) newErrors.price = t('validation.priceRequired');
    else if (isNaN(Number(price)) || Number(price) <= 0)
      newErrors.price = t('validation.priceInvalid');

    if (isNegotiable) {
      const hasMin = minPrice.trim() !== '';
      const hasMax = maxPrice.trim() !== '';

      if (hasMin && (isNaN(Number(minPrice)) || Number(minPrice) <= 0))
        newErrors.minPrice = t('validation.minPriceInvalid');

      if (hasMax && (isNaN(Number(maxPrice)) || Number(maxPrice) <= 0))
        newErrors.maxPrice = t('validation.maxPriceInvalid');
      else if (hasMax && !newErrors.maxPrice && hasMin && !newErrors.minPrice && Number(minPrice) > Number(maxPrice))
        newErrors.maxPrice = t('validation.maxPriceLessThanMin');

      if (hasMin && !hasMax && !newErrors.minPrice) newErrors.maxPrice = t('validation.minMaxPairRequired');
      if (hasMax && !hasMin && !newErrors.maxPrice) newErrors.minPrice = t('validation.minMaxPairRequired');
    }

    // Date
    if (availableFrom && isNaN(Date.parse(availableFrom)))
      newErrors.availableFrom = t('validation.dateInvalid');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, content, price, minPrice, maxPrice, availableFrom, isNegotiable, t]);

  // ── AI Validity Check ──
  const hasNewUploads = newFiles.length > 0;
  const hasMediaSelected = selectedMediaIds.size > 0 || selectedNewFileIndices.size > 0;
  const aiChecksPassed =
    (!needsContentVerify || isContentValid) &&
    (!hasNewUploads || (allImagesAnalyzed && allImagesPassed));

  const isTypeUpdateDisabled =
    listing.status === 'PUBLISHED' || listing.status === 'SOLD' || listing.status === 'RENTED';

  // Live re-validate after first submit attempt
  React.useEffect(() => {
    if (hasAttemptedSubmit) validateForm();
  }, [hasAttemptedSubmit, validateForm]);

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    if (!validateForm()) return;

    if (!aiChecksPassed) {
      toast.error(
        t('aiAnalysis.notAllowed', {
          fallback: 'Content or media did not pass AI verification.',
        })
      );
      return;
    }

    const payload: EditListingPayload = {
      name: name.trim() !== listing.name ? name.trim() : undefined,
      content: content.trim() !== (listing.content || '') ? content.trim() || null : undefined,
      price: Number(price) !== listing.price ? Number(price) : undefined,
      min_price: minPrice.trim() ? Number(minPrice) : null,
      max_price: maxPrice.trim() ? Number(maxPrice) : null,
      is_negotiable: isNegotiable,
      available_from: availableFrom || null,
      security_deposit: securityDeposit.trim() ? Number(securityDeposit) : null,
      media_ids: Array.from(selectedMediaIds),
      primary_media_id:
        primaryMediaId && !primaryMediaId.startsWith('new:') ? primaryMediaId : null,
      listing_type: listingType,
    };

    try {
      if (newFiles.length > 0) {
        const filesToUpload = newFiles.filter((_, i) => selectedNewFileIndices.has(i));
        if (filesToUpload.length > 0) {
          const uploadRes = await mediaApi.uploadBulkMedia(filesToUpload, 'listings');
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
          if (primaryMediaId?.startsWith('new:')) {
            const index = parseInt(primaryMediaId.split(':')[1], 10);
            if (uploadedResults[index]) {
              payload.primary_media_id = uploadedResults[index].media_id;
            }
          }
        }
      }

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      );

      await updateMutation.mutateAsync({
        listingId: listing.listing_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: cleanPayload as any,
      });
      toast.success(t('editSuccess'));
      onOpenChange(false);
    } catch {
      toast.error(t('editError'));
    }
  };

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
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <Dialog.Content className='fixed left-[50%] top-[50%] z-50 flex h-[90vh] w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden border border-primary/20 bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-2xl'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-primary/20 bg-background px-6 py-4'>
            <div>
              <Dialog.Title className='text-xl font-bold text-foreground'>
                {t('editTitle')}
              </Dialog.Title>
              <Dialog.Description className='text-sm text-muted-foreground mt-1'>
                {t('editSubtitle')}
              </Dialog.Description>
            </div>
            <Dialog.Close className='cursor-pointer rounded-full p-2 transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'>
              <X className='h-5 w-5 text-secondary' />
              <span className='sr-only'>Close</span>
            </Dialog.Close>
          </div>

          {/* Form Content */}
          <div className='flex-1 overflow-y-auto px-6 py-8 custom-scrollbar'>
            <div className='mx-auto max-w-3xl space-y-10'>
              {/* Type, Name & Content */}
              <div className='space-y-6'>
                <h3 className='text-lg font-bold text-foreground border-b border-primary/20 pb-2'>
                  {t('listingInformation')}
                </h3>

                <div className='flex flex-col gap-2'>
                  <span className='text-sm font-medium text-foreground'>
                    {t('listingTypeLabel')}
                    <span className='text-primary'>*</span>
                  </span>
                  <ListingTypeSelector
                    value={listingType}
                    onChange={setListingType}
                    labels={{ rent: t('listingTypeRent'), sale: t('listingTypeSale') }}
                    disabled={isTypeUpdateDisabled}
                  />
                </div>

                <ListingNameInput
                  value={name}
                  onChange={setName}
                  label={t('listingName')}
                  placeholder={t('listingNamePlaceholder')}
                  error={errors.name}
                />

                <ListingContentTextarea
                  value={content}
                  onChange={setContent}
                  label={t('listingContent')}
                  placeholder={t('listingContentPlaceholder')}
                  rows={5}
                  error={errors.content}
                />

                {/* AI Content Verification */}
                <ContentVerificationStatusPanel
                  hasContent={!!(name.trim() || content.trim())}
                  status={contentStatus}
                  labels={{
                    title: t('aiAnalysis.contentVerification'),
                    verified: t('aiAnalysis.verified'),
                    violated: t('aiAnalysis.violated'),
                  }}
                />
              </div>

              {/* Pricing */}
              <div className='space-y-6'>
                <h3 className='text-lg font-bold text-foreground border-b border-primary/20 pb-2'>
                  {t('price')}
                </h3>

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
                />

                {listingType === 'RENT' && (
                  <ListingDateField
                    value={availableFrom}
                    onChange={setAvailableFrom}
                    label={t('dateAvailable')}
                    error={errors.availableFrom}
                  />
                )}
              </div>

              {/* Media Selection */}
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-foreground'>{t('mediaUpload')}</span>
                  {(listing.media || []).length > 0 && (
                    <span className='text-xs text-muted-foreground/70'>
                      {selectedMediaIds.size + selectedNewFileIndices.size} / 10{' '}
                      {t('selected', { fallback: 'selected' })}
                    </span>
                  )}
                </div>
                <p className='text-xs text-muted-foreground/70'>
                  {t('mediaUploadHint', {
                    fallback: 'Select existing media or upload new ones (max 10)',
                  })}
                </p>

                {!hasMediaSelected && (
                  <div className='mt-1 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600'>
                    <AlertCircle className='h-4 w-4' />
                    <span>
                      {t('validation.mediaRequired', {
                        fallback: 'At least one media item is required',
                      })}
                    </span>
                  </div>
                )}

                {existingMediaItems.length > 0 ? (
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
                ) : (
                  <div className='rounded-xl border border-dashed border-primary/20 bg-primary/5 p-8 text-center'>
                    <p className='text-sm font-medium text-muted-foreground'>
                      No media available from the property.
                    </p>
                  </div>
                )}

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

          {/* Footer Actions */}
          <div className='flex items-center justify-end gap-3 border-t border-primary/20 bg-background px-6 py-4'>
            <button
              type='button'
              onClick={() => onOpenChange(false)}
              className='cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            >
              {t('cancel')}
            </button>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={updateMutation.isPending || !aiChecksPassed || !hasMediaSelected}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                !updateMutation.isPending && aiChecksPassed && hasMediaSelected
                  ? 'bg-primary hover:bg-primary/90 hover:shadow-md'
                  : 'bg-primary/30 cursor-not-allowed'
              )}
            >
              {updateMutation.isPending ? (
                <Spinner className='h-4 w-4 text-white' />
              ) : (
                <Save className='h-4 w-4' />
              )}
              {t('saveChanges')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
