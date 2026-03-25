'use client';

import * as React from 'react';
import { Home, MapPin, Upload, Calendar } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import type {
  UserProperty,
  ListingType,
  CreateListingFormData,
} from '../model/types';
import { AttributeIcon } from '@/shared/ui/attribute-icon/attribute-icon';
import { Check } from 'lucide-react';

interface ListingInformationStepProps {
  selectedProperty: UserProperty;
  onPrevious: () => void;
  onSubmit: (data: CreateListingFormData) => void;
}

function ReadOnlyField({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
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
}: ListingInformationStepProps) {
  const t = useTranslations('CreateListingModal');

  const [listingType, setListingType] = React.useState<ListingType>('RENT');
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [isNegotiable, setIsNegotiable] = React.useState(false);
  const [availableFrom, setAvailableFrom] = React.useState('');
  const [description, setDescription] = React.useState(
    selectedProperty.description ?? ''
  );

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
      (attr) => attr.valueNumber !== null || attr.valueText !== null
    ) || [];

  const booleanFeatures =
    selectedProperty.attributes?.filter(
      (attr) => attr.valueBoolean === true
    ) || [];

  const handleSubmit = () => {
    const formData: CreateListingFormData = {
      propertyId: selectedProperty.propertyId,
      listingType,
      name,
      price,
      minPrice,
      maxPrice,
      isNegotiable,
      availableFrom,
      description,
    };
    onSubmit(formData);
  };

  const isValid = name.trim() !== '' && price.trim() !== '';

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
                className='rounded-lg border border-purple-92 bg-white px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 transition-colors focus:border-main-primary focus:outline-none'
              />
            </div>

            {/* Listing Type */}
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
                        listingType === type
                          ? 'border-main-primary'
                          : 'border-purple-92'
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
                  value={attr.displayValue ?? (attr.valueText ?? attr.valueNumber?.toString() ?? '—')}
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
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-main-black'>
                  {t('price')}
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
                    className='flex-1 px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 focus:outline-none'
                  />
                </div>
              </div>
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
            </div>

            {/* Min / Max Price */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-main-black'>
                  {t('minPrice')}
                </label>
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
              </div>
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-main-black'>
                  {t('maxPrice')}
                </label>
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
              </div>
            </div>

            {/* Negotiable */}
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-main-black'>
                {t('negotiable')}
              </span>
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
                <span className='text-sm font-medium text-main-black'>
                  {t('selectAmenities')}
                </span>
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
                <span className='text-sm font-medium text-main-black'>
                  {t('features', { fallback: 'Features' })}
                </span>
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

            {/* Description */}
            <div className='flex flex-col gap-2'>
              <label className='text-sm font-medium text-main-black'>
                {t('description')}
                <span className='text-main-primary'>*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={5}
                className='rounded-lg border border-purple-92 bg-white px-4 py-3 text-sm text-main-black placeholder:text-main-secondary/50 transition-colors focus:border-main-primary focus:outline-none resize-none'
              />
            </div>

            {/* Date Available */}
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

            {/* Media Upload Zone */}
            <div className='flex flex-col gap-2'>
              <span className='text-sm font-medium text-main-black'>
                {t('mediaUpload')}
              </span>
              <p className='text-xs text-main-secondary/50'>
                {t('mediaUploadHint')}
              </p>
              <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-92 bg-purple-98/30 px-6 py-10 text-center transition-colors hover:border-main-primary/40 cursor-pointer'>
                <Upload className='mb-3 h-8 w-8 text-main-primary/50' />
                <p className='text-sm font-medium text-main-secondary/60'>
                  {t('dragAndDrop')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — Previous / Submit */}
      <div className='shrink-0 flex items-center justify-end gap-4 border-t border-purple-92/50 px-4 md:px-8 py-4 md:py-5 bg-white'>
        <button
          type='button'
          onClick={onPrevious}
          className='flex min-w-[140px] items-center justify-center rounded-lg bg-purple-98 px-6 py-3 md:py-4 text-base font-bold text-main-primary transition-colors hover:bg-purple-96'
        >
          {t('previous')}
        </button>
        <button
          type='button'
          onClick={handleSubmit}
          disabled={!isValid}
          className={cn(
            'flex min-w-[140px] items-center justify-center rounded-lg px-6 py-3 md:py-4 text-base font-bold text-white transition-all',
            isValid
              ? 'bg-main-primary hover:bg-main-primary/90 shadow-[0px_4px_16px_0px_rgba(112,101,240,0.3)]'
              : 'bg-main-primary/30 cursor-not-allowed'
          )}
        >
          {t('submit')}
        </button>
      </div>
    </>
  );
}
