'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Search, SlidersHorizontal, X, Map } from 'lucide-react';
import { VndAmountInput } from '@/shared/ui/vnd-amount-input/vnd-amount-input';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/select';

interface LocationOption {
  location_id: string;
  name: string;
}

interface HeroSearchBannerProps {
  activeTab: 'buy' | 'rent';
  location: string;
  onLocationChange: (val: string) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  propertyType: string | undefined;
  onPropertyTypeChange: (val: string | undefined) => void;
  districtId: string | undefined;
  onDistrictChange: (val: string | undefined) => void;
  districts: LocationOption[];
  onSearch: () => void;
  onOpenFilters: () => void;
  onToggleMapView?: () => void;
  isMapView?: boolean;
  secondaryActions?: React.ReactNode;
}

export function HeroSearchBanner({
  activeTab,
  location,
  onLocationChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  propertyType,
  onPropertyTypeChange,
  districtId,
  onDistrictChange,
  districts,
  onSearch,
  onOpenFilters,
  onToggleMapView,
  isMapView,
  secondaryActions,
}: HeroSearchBannerProps) {
  const t = useTranslations('HeroSearch');
  const router = useRouter();
  const locale = useLocale();

  return (
    <section className='relative w-full overflow-hidden'>
      {/* Background Image */}
      <div className='absolute inset-0'>
        <Image
          src='/landing.png'
          alt='RealVista'
          fill
          className='object-cover'
          priority
          sizes='100vw'
        />
        <div className='absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/40' />
      </div>

      {/* Content */}
      <div className='relative z-10 mx-auto max-w-5xl px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8'>
        {/* Title */}
        <div className='mb-8 sm:mb-10'>
          <h1 className='text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl'>
            {t('heroTitle')}
          </h1>
          <h2 className='mt-1 text-2xl font-bold text-white/90 sm:text-3xl lg:text-4xl'>
            {t('heroWith')}
          </h2>
          <p className='mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base'>
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Search Card */}
        <div className='rounded-xl bg-white p-4 shadow-lg sm:p-5'>
          {/* ROW 1 — Tabs + Location + Secondary Actions */}
          <div className='flex items-center gap-3 mb-3'>
            {/* Listing Type Toggle */}
            <div className='flex items-center gap-1 shrink-0'>
              <button
                type='button'
                onClick={() => router.push(`/${locale}/buy`)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'buy'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('listingTypeSale')}
              </button>
              <button
                type='button'
                onClick={() => router.push(`/${locale}/rent`)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'rent'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('listingTypeRent')}
              </button>
            </div>

            {/* Location Input */}
            <div className='relative flex-1 min-w-0 rounded-full bg-muted'>
              <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <input
                type='text'
                placeholder={t('locationPlaceholder')}
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className='h-10 w-full bg-transparent pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none rounded-full'
                maxLength={100}
              />
              {location && (
                <button
                  type='button'
                  onClick={() => onLocationChange('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                >
                  <X className='h-4 w-4' />
                </button>
              )}
            </div>

            {/* Secondary Actions (Profile + Save + Map) */}
            <div className='flex items-center gap-2 shrink-0'>
              {secondaryActions}
              {onToggleMapView && (
                <button
                  type='button'
                  onClick={onToggleMapView}
                  className='flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer'
                  title={isMapView ? t('listView') : t('mapView')}
                >
                  <Map className='h-4 w-4' />
                </button>
              )}
            </div>
          </div>

          {/* ROW 2 — Filters + Search */}
          <div className='flex items-center rounded-xl'>

            {/* District */}
            <Select
              value={districtId || 'ALL'}
              onValueChange={(value) => onDistrictChange(value === 'ALL' ? undefined : value)}
            >
              <SelectTrigger className='h-auto w-auto min-w-[170px] border-0 bg-transparent px-3 py-2 text-sm cursor-pointer focus:ring-0 focus:ring-offset-0'>
                <div className='flex flex-col items-start'>
                  <span className='text-[11px] text-muted-foreground'>{t('location')}</span>
                  <SelectValue placeholder={t('allDistricts')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>{t('allDistricts')}</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district.location_id} value={district.location_id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Divider */}
            <div className='h-8 w-px shrink-0 bg-border' />

            {/* Price */}
            <div className='flex-1 min-w-0 flex flex-col px-3 py-2'>
              <span className='text-[11px] text-muted-foreground'>{t('price')}</span>
              <div className='flex items-center gap-2'>
                <VndAmountInput
                  placeholder={t('minPrice')}
                  value={Number(minPrice) || 0}
                  onChange={(val) => onMinPriceChange(val ? val.toString() : '')}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  hidePreview
                  inputClassName='h-6 w-full border-0 bg-transparent text-sm font-medium text-foreground shadow-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-0 rounded-none p-0 pr-8'
                />
                <span className='text-muted-foreground text-xs shrink-0'>–</span>
                <VndAmountInput
                  placeholder={t('maxPrice')}
                  value={Number(maxPrice) || 0}
                  onChange={(val) => onMaxPriceChange(val ? val.toString() : '')}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  hidePreview
                  inputClassName='h-6 w-full border-0 bg-transparent text-sm font-medium text-foreground shadow-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-0 rounded-none p-0 pr-8'
                />
              </div>
            </div>

            {/* Divider */}
            <div className='h-8 w-px shrink-0 bg-border' />

            {/* Property Type */}
            <Select
              value={propertyType || 'ALL'}
              onValueChange={(value) => onPropertyTypeChange(value === 'ALL' ? undefined : value)}
            >
              <SelectTrigger className='h-auto w-auto min-w-[180px] border-0 bg-transparent px-3 py-2 text-sm cursor-pointer focus:ring-0 focus:ring-offset-0'>
                <div className='flex flex-col items-start'>
                  <span className='text-[11px] text-muted-foreground'>{t('propertyType')}</span>
                  <SelectValue placeholder={t('allTypes')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>{t('allTypes')}</SelectItem>
                {PROPERTY_TYPES.map((category) => (
                  <SelectGroup key={category.code}>
                    <SelectLabel>{category.label}</SelectLabel>
                    {category.types.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            {/* Search Button */}
            <button
              type='button'
              onClick={onSearch}
              className='mx-1.5 flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors cursor-pointer'
            >
              <Search className='h-4 w-4' />
              <span className='text-sm'>{t('search')}</span>
            </button>

            {/* Advanced Filters */}
            <button
              type='button'
              onClick={onOpenFilters}
              className='mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer'
              title={t('filters')}
            >
              <SlidersHorizontal className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
