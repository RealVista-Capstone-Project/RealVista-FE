'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/shared/lib/utils';
import { useUpdateListing } from '../api/use-update-listing';
import type { EditListingPayload } from '../model/types';
import type { Listing, ListingType } from '@/entities/listing';

interface EditListingModalProps {
  listing: Listing;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditListingModal({ listing, isOpen, onOpenChange }: EditListingModalProps) {
  const t = useTranslations('CreateListingModal'); // Reuse translations
  const updateMutation = useUpdateListing();

  // Form State
  const [name, setName] = React.useState(listing.name);
  const [content, setContent] = React.useState(listing.content || '');
  const [listingType, setListingType] = React.useState<ListingType>(listing.listing_type);
  const [price, setPrice] = React.useState(listing.price.toString());
  const [minPrice, setMinPrice] = React.useState(listing.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = React.useState(listing.max_price?.toString() || '');
  const [isNegotiable, setIsNegotiable] = React.useState(listing.is_negotiable);
  const [availableFrom, setAvailableFrom] = React.useState(listing.available_from || '');

  // Media State
  const initialMediaIds = new Set(listing.media?.map((m) => m.media_id) || []);
  const initialPrimary = listing.media?.find((m) => m.is_primary)?.media_id || null;
  const [selectedMediaIds, setSelectedMediaIds] = React.useState<Set<string>>(initialMediaIds);
  const [primaryMediaId, setPrimaryMediaId] = React.useState<string | null>(initialPrimary);

  // Reset form when opened with a new listing
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
      setErrors({});
    }
  }, [isOpen, listing]);

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

  // Validation
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = t('validation.nameRequired');
    if (name.length > 500) newErrors.name = t('validation.nameTooLong');
    if (!price.trim()) newErrors.price = t('validation.priceRequired');
    else if (isNaN(Number(price)) || Number(price) <= 0) newErrors.price = t('validation.priceInvalid');

    if (!minPrice.trim()) newErrors.minPrice = t('validation.minPriceRequired');
    else if (isNaN(Number(minPrice)) || Number(minPrice) <= 0) newErrors.minPrice = t('validation.minPriceInvalid');

    if (!maxPrice.trim()) newErrors.maxPrice = t('validation.maxPriceRequired');
    else if (isNaN(Number(maxPrice)) || Number(maxPrice) <= 0) newErrors.maxPrice = t('validation.maxPriceInvalid');

    if (availableFrom && isNaN(Date.parse(availableFrom))) {
      newErrors.availableFrom = t('validation.dateInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload: EditListingPayload = {
      name: name.trim() !== listing.name ? name.trim() : undefined,
      content: content.trim() !== (listing.content || '') ? content.trim() || null : undefined,
      listing_type: listingType !== listing.listing_type ? listingType : undefined,
      price: Number(price) !== listing.price ? Number(price) : undefined,
      min_price: minPrice.trim() ? Number(minPrice) : null,
      max_price: maxPrice.trim() ? Number(maxPrice) : null,
      is_negotiable: isNegotiable,
      available_from: availableFrom || null,
      media_ids: Array.from(selectedMediaIds),
      primary_media_id: primaryMediaId ?? null,
    };

    // Remove empty payload fields that haven't changed to send a minimal PATCH/PUT
    // Actually our API expects full PUT right now, so we send what we have, but omit undefined.
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    try {
      await updateMutation.mutateAsync({
        listingId: listing.listing_id,
        data: cleanPayload,
      });
      toast.success(t('editSuccess'));
      onOpenChange(false);
    } catch {
      toast.error(t('editError'));
    }
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
                  <div className='flex gap-4'>
                    {(['RENT', 'SALE'] as ListingType[]).map((type) => (
                      <label key={type} className='flex cursor-pointer items-center gap-2'>
                        <div className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors', listingType === type ? 'border-main-primary' : 'border-purple-92')}>
                          {listingType === type && <div className='h-2.5 w-2.5 rounded-full bg-main-primary' />}
                        </div>
                        <input type='radio' name='listingType' value={type} checked={listingType === type} onChange={() => setListingType(type)} className='sr-only' />
                        <span className='text-sm font-medium text-main-black'>
                          {type === 'RENT' ? t('listingTypeRent') : t('listingTypeSale')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium text-main-black'>
                    {t('listingName')} <span className='text-main-primary'>*</span>
                  </label>
                  <input
                    type='text' value={name} onChange={(e) => setName(e.target.value)} maxLength={500}
                    placeholder={t('listingNamePlaceholder')}
                    className={cn('rounded-lg border bg-white px-4 py-3 text-sm text-main-black transition-colors focus:outline-none', errors.name ? 'border-red-400 focus:border-red-500' : 'border-purple-92 focus:border-main-primary')}
                  />
                  {errors.name && <span className='text-xs text-red-500'>{errors.name}</span>}
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium text-main-black'>{t('listingContent')}</label>
                  <textarea
                    value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('listingContentPlaceholder')} rows={5}
                    className='rounded-lg border border-purple-92 bg-white px-4 py-3 text-sm text-main-black transition-colors focus:border-main-primary focus:outline-none resize-none'
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className='space-y-6'>
                <h3 className='text-lg font-bold text-main-black border-b border-purple-92 pb-2'>
                  {t('price')}
                </h3>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className={cn('flex flex-col gap-2', listingType === 'SALE' && 'sm:col-span-2')}>
                    <label className='text-sm font-medium text-main-black'>
                      {listingType === 'RENT' ? t('priceRent') : t('priceSale')} <span className='text-main-primary'>*</span>
                    </label>
                    <div className='flex items-center rounded-lg border border-purple-92 bg-white overflow-hidden transition-colors focus-within:border-main-primary'>
                      <span className='flex h-full items-center border-r border-purple-92 bg-purple-98/50 px-3 text-sm text-main-secondary/50'>₫</span>
                      <input type='text' inputMode='numeric' value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t('pricePlaceholder')} className={cn('flex-1 px-4 py-3 text-sm text-main-black focus:outline-none', errors.price && 'text-red-500')} />
                    </div>
                    {errors.price && <span className='text-xs text-red-500'>{errors.price}</span>}
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium text-main-black'>{t('minPrice')}</label>
                    <div className='flex items-center rounded-lg border border-purple-92 bg-white overflow-hidden transition-colors focus-within:border-main-primary'>
                      <span className='flex h-full items-center border-r border-purple-92 bg-purple-98/50 px-3 text-sm text-main-secondary/50'>₫</span>
                      <input type='text' inputMode='numeric' value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={t('pricePlaceholder')} className='flex-1 px-4 py-3 text-sm text-main-black focus:outline-none' />
                    </div>
                    {errors.minPrice && <span className='text-xs text-red-500'>{errors.minPrice}</span>}
                  </div>
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium text-main-black'>{t('maxPrice')}</label>
                    <div className='flex items-center rounded-lg border border-purple-92 bg-white overflow-hidden transition-colors focus-within:border-main-primary'>
                      <span className='flex h-full items-center border-r border-purple-92 bg-purple-98/50 px-3 text-sm text-main-secondary/50'>₫</span>
                      <input type='text' inputMode='numeric' value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={t('pricePlaceholder')} className='flex-1 px-4 py-3 text-sm text-main-black focus:outline-none' />
                    </div>
                    {errors.maxPrice && <span className='text-xs text-red-500'>{errors.maxPrice}</span>}
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-main-black'>{t('negotiable')}</span>
                  <button type='button' role='switch' aria-checked={isNegotiable} onClick={() => setIsNegotiable(!isNegotiable)} className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors', isNegotiable ? 'bg-main-primary' : 'bg-purple-92')}>
                    <span className={cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform', isNegotiable ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium text-main-black'>{t('dateAvailable')}</label>
                  <input type='date' value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className='rounded-lg border border-purple-92 bg-white px-4 py-3 text-sm text-main-black transition-colors focus:border-main-primary focus:outline-none' />
                  {errors.availableFrom && <span className='text-xs text-red-500'>{errors.availableFrom}</span>}
                </div>
              </div>

              {/* Media Selection */}
              <div className='space-y-6'>
                <h3 className='text-lg font-bold text-main-black border-b border-purple-92 pb-2'>
                  {t('mediaUpload')}
                </h3>
                {listing.property.media && listing.property.media.length > 0 ? (
                  <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
                    {listing.property.media.map((media) => {
                      const isSelected = selectedMediaIds.has(media.media_id);
                      const isPrimary = primaryMediaId === media.media_id;

                      return (
                        <div key={media.media_id} className='group relative aspect-square overflow-hidden rounded-xl border-2 transition-all' style={{ borderColor: isPrimary ? 'var(--main-primary)' : isSelected ? 'var(--main-primary)' : 'transparent' }}>
                          {media.media_type === 'IMAGE' ? (
                            <Image src={media.media_url || media.thumbnail_url} alt='' fill className='object-cover' />
                          ) : (
                            <div className='flex h-full w-full items-center justify-center bg-purple-92/30'>
                              <span className='text-xs font-semibold uppercase text-main-secondary'>
                                {media.media_type}
                              </span>
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className={cn('absolute inset-0 bg-main-black/40 transition-opacity', isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 p-4'>
                              <button type='button' onClick={() => toggleMedia(media.media_id)} className={cn('w-full rounded-lg py-1.5 text-xs font-bold transition-colors', isSelected ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-main-black hover:bg-purple-98')}>
                                {isSelected ? t('remove') : t('select')}
                              </button>
                              {isSelected && !isPrimary && (
                                <button type='button' onClick={(e) => { e.stopPropagation(); setPrimaryMediaId(media.media_id); }} className='w-full rounded-lg bg-main-primary/90 py-1.5 text-xs font-bold text-white transition-colors hover:bg-main-primary'>
                                  {t('makePrimary')}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Top Badges */}
                          <div className='absolute left-2 top-2 flex flex-col gap-1'>
                            <div className='rounded bg-main-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md'>
                              {t('readOnly')}
                            </div>
                            {isPrimary && (
                              <div className='rounded bg-main-primary px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm'>
                                {t('primary')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className='rounded-xl border border-dashed border-purple-92 bg-purple-98/50 p-8 text-center'>
                    <p className='text-sm font-medium text-main-secondary/80'>
                      No media available from the property.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className='flex items-center justify-end gap-3 border-t border-purple-92 bg-white px-6 py-4'>
            <button type='button' onClick={() => onOpenChange(false)} className='rounded-xl px-5 py-2.5 text-sm font-bold text-main-black transition-colors hover:bg-purple-98'>
              {t('cancel')}
            </button>
            <button type='button' onClick={handleSubmit} disabled={updateMutation.isPending} className='flex items-center gap-2 rounded-xl bg-main-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-main-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70'>
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
