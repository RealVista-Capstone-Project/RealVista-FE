'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/shared/lib/utils';
import { mediaApi, type MediaUploadResponse } from '@/entities/media/api/media.api';
import { useUpdateListing } from '../api/use-update-listing';
import type { EditListingPayload } from '../model/types';
import type { Listing, ListingType } from '@/entities/listing';
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = t('validation.nameRequired');
    if (name.length > 500) newErrors.name = t('validation.nameTooLong');
    if (!price.trim()) newErrors.price = t('validation.priceRequired');
    else if (isNaN(Number(price)) || Number(price) <= 0)
      newErrors.price = t('validation.priceInvalid');

    if (minPrice.trim() && (isNaN(Number(minPrice)) || Number(minPrice) <= 0))
      newErrors.minPrice = t('validation.minPriceInvalid');

    if (maxPrice.trim() && (isNaN(Number(maxPrice)) || Number(maxPrice) <= 0))
      newErrors.maxPrice = t('validation.maxPriceInvalid');

    if (availableFrom && isNaN(Date.parse(availableFrom))) {
      newErrors.availableFrom = t('validation.dateInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── AI Validity Check ──
  const hasNewUploads = newFiles.length > 0;
  const hasMediaSelected = selectedMediaIds.size > 0 || selectedNewFileIndices.size > 0;
  const aiChecksPassed =
    (!needsContentVerify || isContentValid) &&
    (!hasNewUploads || (allImagesAnalyzed && allImagesPassed));

  const handleSubmit = async () => {
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
      media_ids: Array.from(selectedMediaIds),
      primary_media_id:
        primaryMediaId && !primaryMediaId.startsWith('new:') ? primaryMediaId : null,
    };

    try {
      if (newFiles.length > 0) {
        const filesToUpload = newFiles.filter((_, i) => selectedNewFileIndices.has(i));
        if (filesToUpload.length > 0) {
          const uploadRes = await mediaApi.uploadBulk(filesToUpload);
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
          payload.new_medias = uploadedResults.map((res: MediaUploadResponse, index: number) => ({
            url: res.media_url,
            type: res.media_type,
            isPrimary: primaryMediaId === `new:${index}`,
          }));

          if (primaryMediaId?.startsWith('new:')) {
            payload.primary_media_id = null;
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
        <Dialog.Overlay className='fixed inset-0 z-50 bg-main-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <Dialog.Content className='fixed left-[50%] top-[50%] z-50 flex h-[90vh] w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden border border-purple-92 bg-purple-98 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-2xl'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-purple-92 bg-white px-6 py-4'>
            <div>
              <Dialog.Title className='text-xl font-bold text-main-black'>
                {t('editTitle')}
              </Dialog.Title>
              <Dialog.Description className='text-sm text-main-secondary/70 mt-1'>
                {t('editSubtitle')}
              </Dialog.Description>
            </div>
            <Dialog.Close className='rounded-full p-2 transition-colors hover:bg-purple-98'>
              <X className='h-5 w-5 text-main-secondary' />
              <span className='sr-only'>Close</span>
            </Dialog.Close>
          </div>

          {/* Form Content */}
          <div className='flex-1 overflow-y-auto px-6 py-8 custom-scrollbar'>
            <div className='mx-auto max-w-3xl space-y-10'>
              {/* Type, Name & Content */}
              <div className='space-y-6'>
                <h3 className='text-lg font-bold text-main-black border-b border-purple-92 pb-2'>
                  {t('listingInformation')}
                </h3>

                <div className='flex flex-col gap-2'>
                  <span className='text-sm font-medium text-main-black'>
                    {t('listingTypeLabel')}
                    <span className='text-main-primary'>*</span>
                  </span>
                  <ListingTypeSelector
                    value={listingType}
                    onChange={setListingType}
                    labels={{ rent: t('listingTypeRent'), sale: t('listingTypeSale') }}
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
                <h3 className='text-lg font-bold text-main-black border-b border-purple-92 pb-2'>
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
                  <span className='text-sm font-medium text-main-black'>{t('mediaUpload')}</span>
                  {(listing.media || []).length > 0 && (
                    <span className='text-xs text-main-secondary/50'>
                      {selectedMediaIds.size + selectedNewFileIndices.size} / 10{' '}
                      {t('selected', { fallback: 'selected' })}
                    </span>
                  )}
                </div>
                <p className='text-xs text-main-secondary/50'>
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
                  <div className='rounded-xl border border-dashed border-purple-92 bg-purple-98/50 p-8 text-center'>
                    <p className='text-sm font-medium text-main-secondary/80'>
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
          <div className='flex items-center justify-end gap-3 border-t border-purple-92 bg-white px-6 py-4'>
            <button
              type='button'
              onClick={() => onOpenChange(false)}
              className='rounded-xl px-5 py-2.5 text-sm font-bold text-main-black transition-colors hover:bg-purple-98'
            >
              {t('cancel')}
            </button>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={updateMutation.isPending || !aiChecksPassed || !hasMediaSelected}
              className={cn(
                'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all',
                !updateMutation.isPending && aiChecksPassed && hasMediaSelected
                  ? 'bg-main-primary hover:bg-main-primary/90 hover:shadow-md'
                  : 'bg-main-primary/30 cursor-not-allowed'
              )}
            >
              {updateMutation.isPending ? (
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white' />
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
