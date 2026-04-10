'use client';

import { useEffect, useRef, useState } from 'react';
import {
  OwnerPropertiesProvider,
  useOwnerPropertiesContext,
  type PriceFilter,
  type ListingType,
} from '@/features/agent-proposal/model/owner-properties-context';
import { OwnerPropertyCard } from '@/features/agent-proposal/ui/owner-property-card';
import { OwnerPropertyDetailPanel } from '@/features/agent-proposal/ui/owner-property-detail-panel';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Search, Home, Filter, X, DollarSign, Building, KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/shared/lib/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';
import { formatVND } from '@/shared/lib/utils/format-currency';

function parseFormattedNumber(value: string): number | undefined {
  const numericValue = value.replace(/[^0-9]/g, '');
  if (!numericValue) return undefined;
  const number = parseInt(numericValue, 10);
  return isNaN(number) ? undefined : number;
}

interface LocalPriceFilter {
  minRentPrice: string;
  maxRentPrice: string;
  minBuyPrice: string;
  maxBuyPrice: string;
}

function ListingTypeTabs() {
  const t = useTranslations('OwnerProperties');
  const { listingType, setListingType } = useOwnerPropertiesContext();

  const tabs: { value: ListingType; label: string; icon: React.ReactNode }[] = [
    { value: 'ALL', label: t('tabs.all'), icon: <Building className='h-4 w-4' /> },
    { value: 'SELL', label: t('tabs.sell'), icon: <KeyRound className='h-4 w-4' /> },
    { value: 'RENT', label: t('tabs.rent'), icon: <Building className='h-4 w-4' /> },
  ];

  return (
    <div className='flex gap-1 p-1 bg-purple-98 rounded-lg'>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setListingType(tab.value)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
            listingType === tab.value
              ? 'bg-white text-main-primary shadow-sm'
              : 'text-main-secondary hover:text-main-black'
          )}
        >
          {tab.icon}
          <span className='hidden sm:inline'>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function FilterPanel({ isOpen, onClose }: FilterPanelProps) {
  const t = useTranslations('OwnerProperties');
  const {
    priceFilter,
    setPriceFilter,
    listingType,
    propertyTypeId,
    setPropertyTypeId,
    availablePropertyTypes,
  } = useOwnerPropertiesContext();

  const [localFilter, setLocalFilter] = useState<LocalPriceFilter>({
    minRentPrice: priceFilter.minRentPrice ? formatVND(priceFilter.minRentPrice) : '',
    maxRentPrice: priceFilter.maxRentPrice ? formatVND(priceFilter.maxRentPrice) : '',
    minBuyPrice: priceFilter.minBuyPrice ? formatVND(priceFilter.minBuyPrice) : '',
    maxBuyPrice: priceFilter.maxBuyPrice ? formatVND(priceFilter.maxBuyPrice) : '',
  });

  const handleApply = () => {
    const numericFilter: PriceFilter = {
      minRentPrice: parseFormattedNumber(localFilter.minRentPrice),
      maxRentPrice: parseFormattedNumber(localFilter.maxRentPrice),
      minBuyPrice: parseFormattedNumber(localFilter.minBuyPrice),
      maxBuyPrice: parseFormattedNumber(localFilter.maxBuyPrice),
    };
    setPriceFilter(numericFilter);
    onClose();
  };

  const handleReset = () => {
    setLocalFilter({ minRentPrice: '', maxRentPrice: '', minBuyPrice: '', maxBuyPrice: '' });
    setPriceFilter({});
    setPropertyTypeId(null);
  };

  const updateLocalFilter = (key: keyof LocalPriceFilter, value: string) => {
    setLocalFilter((prev) => ({ ...prev, [key]: value }));
  };

  const showRentFilter = listingType === 'ALL' || listingType === 'RENT';
  const showBuyFilter = listingType === 'ALL' || listingType === 'SELL';

  if (!isOpen) return null;

  return (
    <div className='border-b border-purple-92/50 bg-white px-4 sm:px-5 pb-4 pt-3 space-y-4 animate-in slide-in-from-top-2 duration-200'>

      {/* Property Type Pills */}
      {availablePropertyTypes.length > 0 && (
        <div className='space-y-2'>
          <label className='text-xs font-semibold text-main-black uppercase tracking-wide'>
            {t('filter.propertyType')}
          </label>
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => setPropertyTypeId(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
                propertyTypeId === null
                  ? 'bg-main-primary text-white border-main-primary'
                  : 'bg-purple-98 text-main-secondary border-purple-92 hover:border-main-primary/40 hover:text-main-black'
              )}
            >
              {t('filter.allTypes')}
            </button>
            {availablePropertyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setPropertyTypeId(propertyTypeId === type.id ? null : type.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
                  propertyTypeId === type.id
                    ? 'bg-main-primary text-white border-main-primary'
                    : 'bg-purple-98 text-main-secondary border-purple-92 hover:border-main-primary/40 hover:text-main-black'
                )}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rent Price Range */}
      {showRentFilter && (
        <div className='space-y-2'>
          <label className='text-xs font-semibold text-main-black uppercase tracking-wide flex items-center gap-1.5'>
            <DollarSign className='h-3.5 w-3.5 text-green-600' />
            {t('filter.rentPrice')}
          </label>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              placeholder={t('filter.min')}
              value={localFilter.minRentPrice}
              onChange={(e) => updateLocalFilter('minRentPrice', e.target.value)}
              className='h-9 border-purple-92 bg-white focus:border-main-primary text-sm'
            />
            <Input
              placeholder={t('filter.max')}
              value={localFilter.maxRentPrice}
              onChange={(e) => updateLocalFilter('maxRentPrice', e.target.value)}
              className='h-9 border-purple-92 bg-white focus:border-main-primary text-sm'
            />
          </div>
        </div>
      )}

      {/* Buy Price Range */}
      {showBuyFilter && (
        <div className='space-y-2'>
          <label className='text-xs font-semibold text-main-black uppercase tracking-wide flex items-center gap-1.5'>
            <DollarSign className='h-3.5 w-3.5 text-blue-600' />
            {t('filter.buyPrice')}
          </label>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              placeholder={t('filter.min')}
              value={localFilter.minBuyPrice}
              onChange={(e) => updateLocalFilter('minBuyPrice', e.target.value)}
              className='h-9 border-purple-92 bg-white focus:border-main-primary text-sm'
            />
            <Input
              placeholder={t('filter.max')}
              value={localFilter.maxBuyPrice}
              onChange={(e) => updateLocalFilter('maxBuyPrice', e.target.value)}
              className='h-9 border-purple-92 bg-white focus:border-main-primary text-sm'
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex gap-2 pt-1'>
        <Button
          onClick={handleApply}
          className='flex-1 h-9 bg-main-primary hover:bg-main-primary/90 text-sm'
        >
          {t('filter.apply')}
        </Button>
        <Button variant='outline' onClick={handleReset} className='h-9 px-3 border-purple-92'>
          <X className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

function OwnerPropertiesContent() {
  const {
    properties,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    searchQuery,
    setSearchQuery,
    listingType,
    selectedProperty,
    setSelectedProperty,
    totalElements,
    handlePropertyClick,
    priceFilter,
    propertyTypeId,
  } = useOwnerPropertiesContext();

  const t = useTranslations('OwnerProperties');
  const isMobile = useIsMobile();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Count active filters for the badge
  const activeFilterCount =
    [
      priceFilter.minRentPrice,
      priceFilter.maxRentPrice,
      priceFilter.minBuyPrice,
      priceFilter.maxBuyPrice,
    ].filter(Boolean).length + (propertyTypeId ? 1 : 0);

  // Trigger next page fetch when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-98 border-t-main-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 shadow-sm'>
            <Home className='h-8 w-8 text-red-400' />
          </div>
          <p className='font-semibold text-gray-800'>{t('error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col overflow-hidden sm:flex-row'>
      {/* ── Left Sidebar ── */}
      <aside
        className={cn(
          'flex-col border-r border-purple-92/50 bg-white transition-all duration-300',
          isMobile ? (selectedProperty ? 'hidden' : 'flex w-full') : 'flex w-[55%]'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-b border-purple-92/50 p-4 sm:p-6'>
            <div className='flex items-center gap-2'>
              <h2 className='text-xl font-bold text-main-black'>{t('pageTitle')}</h2>
              <div className='flex items-center justify-center rounded-lg bg-main-primary px-2 py-1'>
                <span className='text-sm font-bold text-white'>{totalElements}</span>
              </div>
            </div>
            <p className='mt-1 text-sm text-main-secondary/60'>{t('pageSubtitle')}</p>
          </div>

          {/* Search bar + Filter button (same row) */}
          <div className='border-b border-purple-92/50 px-4 sm:px-5 py-3'>
            <div className='flex items-center gap-2'>
              {/* Search input */}
              <div className='relative flex-1'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
                  <Search className='h-4 w-4 text-main-secondary/50' strokeWidth={2} />
                </div>
                <Input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('filter.searchPlaceholder')}
                  className='h-10 w-full rounded-lg border-2 border-purple-92 bg-purple-98 pl-10 pr-4 text-sm font-medium text-main-black placeholder:text-main-secondary/50 focus:border-main-primary focus:outline-none focus-visible:ring-0'
                />
              </div>

              {/* Filter icon button */}
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className={cn(
                  'relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200',
                  filterOpen
                    ? 'border-main-primary bg-main-primary/5 text-main-primary'
                    : activeFilterCount > 0
                      ? 'border-main-primary bg-main-primary/5 text-main-primary'
                      : 'border-purple-92 bg-purple-98 text-main-secondary hover:border-main-primary/40 hover:text-main-black'
                )}
                aria-label={t('filter.title')}
              >
                <Filter className='h-4 w-4' />
                {activeFilterCount > 0 && (
                  <span className='absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-main-primary text-[10px] font-bold text-white'>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Listing Type Tabs */}
          <div className='border-b border-purple-92/50 px-4 sm:px-5 py-3'>
            <ListingTypeTabs />
          </div>

          {/* Collapsible Filter Panel */}
          <FilterPanel isOpen={filterOpen} onClose={() => setFilterOpen(false)} />

          {/* Properties List */}
          <div className='flex-1 overflow-y-auto'>
            {properties.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-4 p-8 text-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50'>
                  <Home className='h-8 w-8 text-indigo-300' />
                </div>
                <div>
                  <p className='font-semibold text-gray-700'>{t('empty.title')}</p>
                  <p className='mt-1 text-sm text-gray-400'>{t('empty.subtitle')}</p>
                </div>
              </div>
            ) : (
              <div className='divide-y divide-purple-92/50'>
                {properties.map((property) => (
                  <OwnerPropertyCard
                    key={property.property_id}
                    property={property}
                    isSelected={selectedProperty?.property_id === property.property_id}
                    onClick={handlePropertyClick}
                    listingType={listingType}
                  />
                ))}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className='h-2' />

                {isFetchingNextPage && (
                  <div className='flex justify-center py-4'>
                    <div className='h-6 w-6 animate-spin rounded-full border-4 border-purple-98 border-t-main-primary' />
                  </div>
                )}

                {!hasNextPage && (
                  <div className='py-4 text-center text-xs text-main-secondary/40'>
                    {t('empty.endOfList')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Right Detail Panel ── */}
      <main
        className={cn(
          'flex-1 overflow-y-auto bg-purple-98',
          isMobile ? (selectedProperty ? 'block' : 'hidden') : 'block'
        )}
      >
        {selectedProperty ? (
          <OwnerPropertyDetailPanel
            key={selectedProperty.property_id}
            property={selectedProperty}
            onBack={() => setSelectedProperty(null)}
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <p className='text-sm text-main-secondary/60'>{t('empty.selectProperty')}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export function OwnerPropertiesPage() {
  return (
    <OwnerPropertiesProvider>
      <OwnerPropertiesContent />
    </OwnerPropertiesProvider>
  );
}
