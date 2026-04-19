'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

// Format a raw number as dot-separated thousands for display in inputs: 2500000 → "2.500.000"
function formatInputNumber(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('vi-VN');
}

// Parse a dot-separated input string back to a number: "2.500.000" → 2500000
function parseInputNumber(value: string): number | undefined {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return undefined;
  const n = parseInt(digits, 10);
  return isNaN(n) ? undefined : n;
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
    { value: 'ALL', label: t('tabs.all'), icon: <Building className='h-[18px] w-[18px]' /> },
    { value: 'SELL', label: t('tabs.sell'), icon: <KeyRound className='h-[18px] w-[18px]' /> },
    { value: 'RENT', label: t('tabs.rent'), icon: <Building className='h-[18px] w-[18px]' /> },
  ];

  return (
    <div className='flex gap-1.5 p-1.5 bg-primary/5 border border-primary/20'>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setListingType(tab.value)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300',
            listingType === tab.value
              ? 'bg-white text-primary shadow-sm border border-primary/30 scale-[1.02]'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent'
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
    isLoadingPropertyTypes,
  } = useOwnerPropertiesContext();

  const [localFilter, setLocalFilter] = useState<LocalPriceFilter>({
    minRentPrice: priceFilter.minRentPrice
      ? formatInputNumber(String(priceFilter.minRentPrice))
      : '',
    maxRentPrice: priceFilter.maxRentPrice
      ? formatInputNumber(String(priceFilter.maxRentPrice))
      : '',
    minBuyPrice: priceFilter.minBuyPrice ? formatInputNumber(String(priceFilter.minBuyPrice)) : '',
    maxBuyPrice: priceFilter.maxBuyPrice ? formatInputNumber(String(priceFilter.maxBuyPrice)) : '',
  });

  // Min > max validation errors
  const rentError =
    localFilter.minRentPrice &&
      localFilter.maxRentPrice &&
      (parseInputNumber(localFilter.minRentPrice) ?? 0) >=
      (parseInputNumber(localFilter.maxRentPrice) ?? Infinity)
      ? t('filter.errorMinMax')
      : null;

  const buyError =
    localFilter.minBuyPrice &&
      localFilter.maxBuyPrice &&
      (parseInputNumber(localFilter.minBuyPrice) ?? 0) >=
      (parseInputNumber(localFilter.maxBuyPrice) ?? Infinity)
      ? t('filter.errorMinMax')
      : null;

  const hasError = !!(rentError || buyError);

  const handleApply = () => {
    if (hasError) return;
    const numericFilter: PriceFilter = {
      minRentPrice: parseInputNumber(localFilter.minRentPrice),
      maxRentPrice: parseInputNumber(localFilter.maxRentPrice),
      minBuyPrice: parseInputNumber(localFilter.minBuyPrice),
      maxBuyPrice: parseInputNumber(localFilter.maxBuyPrice),
    };
    setPriceFilter(numericFilter);
    onClose();
  };

  const handleReset = () => {
    setLocalFilter({ minRentPrice: '', maxRentPrice: '', minBuyPrice: '', maxBuyPrice: '' });
    setPriceFilter({});
    setPropertyTypeId(null);
  };

  // Format digits on every keystroke
  const handlePriceChange = (key: keyof LocalPriceFilter, value: string) => {
    setLocalFilter((prev) => ({ ...prev, [key]: formatInputNumber(value) }));
  };

  const showRentFilter = listingType === 'ALL' || listingType === 'RENT';
  const showBuyFilter = listingType === 'ALL' || listingType === 'SELL';

  // Group types by category
  const typesByCategory = useMemo(() => {
    const map = new Map<string, { categoryName: string; types: typeof availablePropertyTypes }>();
    for (const type of availablePropertyTypes) {
      const existing = map.get(type.categoryId);
      if (existing) {
        existing.types.push(type);
      } else {
        map.set(type.categoryId, { categoryName: type.categoryName, types: [type] });
      }
    }
    return Array.from(map.values());
  }, [availablePropertyTypes]);

  if (!isOpen) return null;

  return (
    <div className='border-b border-primary/20 bg-primary/5 px-4 sm:px-6 pb-6 pt-5 space-y-6 animate-in slide-in-from-top-2 duration-300 shadow-inner'>
      {/* Property Type Pills — grouped by category */}
      <div className='space-y-3.5'>
        <label className='text-[13px] font-bold text-foreground uppercase tracking-wide opacity-90'>
          {t('filter.propertyType')}
        </label>

        {isLoadingPropertyTypes ? (
          /* Loading skeleton */
          <div className='flex flex-wrap gap-2.5'>
            {[80, 100, 70, 110, 90].map((w, i) => (
              <div
                key={i}
                className='h-8 rounded-full bg-primary/10 animate-pulse'
                style={{ width: w }}
              />
            ))}
          </div>
        ) : (
          <div className='space-y-4'>
            {/* "All types" pill always first */}
            <div className='flex flex-wrap gap-2.5'>
              <button
                onClick={() => setPropertyTypeId(null)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
                  propertyTypeId === null
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105'
                    : 'bg-white text-muted-foreground border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground'
                )}
              >
                {t('filter.allTypes')}
              </button>
            </div>

            {typesByCategory.map((group) => (
              <div key={group.categoryName} className='space-y-2'>
                <span className='text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest'>
                  {group.categoryName}
                </span>
                <div className='flex flex-wrap gap-2.5'>
                  {group.types.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPropertyTypeId(propertyTypeId === type.id ? null : type.id)}
                      className={cn(
                        'px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
                        propertyTypeId === type.id
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105'
                          : 'bg-white text-muted-foreground border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground'
                      )}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rent Price Range */}
      {showRentFilter && (
        <div className='space-y-2.5'>
          <label className='text-[13px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 opacity-90'>
            <DollarSign className='h-4 w-4 text-emerald-500' />
            {t('filter.rentPrice')}
            <span className='font-medium text-muted-foreground/50 normal-case tracking-normal'>
              (đ)
            </span>
          </label>
          <div className='grid grid-cols-2 gap-3'>
            <Input
              inputMode='numeric'
              placeholder={t('filter.min')}
              value={localFilter.minRentPrice}
              onChange={(e) => handlePriceChange('minRentPrice', e.target.value)}
              className={cn(
                'h-10 rounded-xl border-primary/20 bg-white px-3 focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm shadow-sm transition-all duration-200',
                rentError && 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
              )}
            />
            <Input
              inputMode='numeric'
              placeholder={t('filter.max')}
              value={localFilter.maxRentPrice}
              onChange={(e) => handlePriceChange('maxRentPrice', e.target.value)}
              className={cn(
                'h-10 rounded-xl border-primary/20 bg-white px-3 focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm shadow-sm transition-all duration-200',
                rentError && 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
              )}
            />
          </div>
          {rentError && (
            <p className='text-xs font-medium text-red-500 animate-in fade-in'>{rentError}</p>
          )}
        </div>
      )}

      {/* Buy Price Range */}
      {showBuyFilter && (
        <div className='space-y-2.5'>
          <label className='text-[13px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 opacity-90'>
            <DollarSign className='h-4 w-4 text-blue-500' />
            {t('filter.buyPrice')}
            <span className='font-medium text-muted-foreground/50 normal-case tracking-normal'>
              (đ)
            </span>
          </label>
          <div className='grid grid-cols-2 gap-3'>
            <Input
              inputMode='numeric'
              placeholder={t('filter.min')}
              value={localFilter.minBuyPrice}
              onChange={(e) => handlePriceChange('minBuyPrice', e.target.value)}
              className={cn(
                'h-10 rounded-xl border-primary/20 bg-white px-3 focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm shadow-sm transition-all duration-200',
                buyError && 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
              )}
            />
            <Input
              inputMode='numeric'
              placeholder={t('filter.max')}
              value={localFilter.maxBuyPrice}
              onChange={(e) => handlePriceChange('maxBuyPrice', e.target.value)}
              className={cn(
                'h-10 rounded-xl border-primary/20 bg-white px-3 focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm shadow-sm transition-all duration-200',
                buyError && 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
              )}
            />
          </div>
          {buyError && (
            <p className='text-xs font-medium text-red-500 animate-in fade-in'>{buyError}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex gap-3 pt-2'>
        <Button
          onClick={handleApply}
          disabled={hasError}
          className='flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-sm font-semibold shadow-md shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5'
        >
          {t('filter.apply')}
        </Button>
        <Button
          variant='outline'
          onClick={handleReset}
          className='h-11 px-4 rounded-xl border-primary/20 bg-white hover:bg-primary/5 hover:text-foreground transition-all duration-200'
        >
          <X className='h-5 w-5' />
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

  // Auto-select first property on desktop if none selected
  useEffect(() => {
    if (!isMobile && !selectedProperty && properties.length > 0) {
      setSelectedProperty(properties[0]);
    }
  }, [isMobile, properties, selectedProperty, setSelectedProperty]);

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary/10 border-t-primary' />
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
          'flex-col border-r border-primary/20 bg-white transition-all duration-300',
          isMobile ? (selectedProperty ? 'hidden' : 'flex w-full') : 'flex w-[55%]'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-b border-primary/20 p-4 sm:p-6 bg-white'>
            <div className='flex items-center gap-3'>
              <h2 className='text-2xl font-extrabold text-foreground tracking-tight'>
                {t('pageTitle')}
              </h2>
              <div className='flex items-center justify-center rounded-full bg-primary/10 px-3 py-0.5 border border-primary/20 shadow-sm'>
                <span className='text-sm font-bold text-primary'>{totalElements}</span>
              </div>
            </div>
            <p className='mt-1.5 text-sm text-muted-foreground'>{t('pageSubtitle')}</p>
          </div>

          {/* Search bar + Filter button (same row) */}
          <div className='border-b border-primary/20 px-4 sm:px-6 py-4 bg-primary/5'>
            <div className='flex items-center gap-3'>
              {/* Search input */}
              <div className='relative flex-1 group'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 transition-colors duration-200 group-focus-within:text-primary'>
                  <Search
                    className='h-[18px] w-[18px] text-muted-foreground/50 group-focus-within:text-primary transition-colors'
                    strokeWidth={2.5}
                  />
                </div>
                <Input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('filter.searchPlaceholder')}
                  className='h-11 w-full rounded-xl border border-primary/20 bg-white pl-11 pr-4 text-sm font-medium text-foreground shadow-sm placeholder:text-muted-foreground/50 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300'
                />
              </div>

              {/* Filter icon button */}
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className={cn(
                  'relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition-all duration-300 shadow-sm',
                  filterOpen
                    ? 'border-primary bg-primary/5 text-primary ring-4 ring-primary/10'
                    : activeFilterCount > 0
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-primary/20 bg-white text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-primary/5'
                )}
                aria-label={t('filter.title')}
              >
                <Filter className='h-5 w-5' />
                {activeFilterCount > 0 && (
                  <span className='absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-white'>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Listing Type Tabs */}
          <div className='border-b border-primary/20 px-4 sm:px-6 py-4 bg-white'>
            <ListingTypeTabs />
          </div>

          {/* Scrollable content: Filter Panel + Properties List */}
          <div className='flex-1 overflow-y-auto bg-gray-50/20'>
            {/* Collapsible Filter Panel — inside scroll area so price inputs are reachable */}
            {filterOpen && <FilterPanel isOpen={filterOpen} onClose={() => setFilterOpen(false)} />}

            {/* Properties List */}
            {properties.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-4 p-12 text-center animate-in fade-in duration-500'>
                <div className='flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 border border-primary/10 shadow-sm'>
                  <Home className='h-8 w-8 text-primary/60' strokeWidth={1.5} />
                </div>
                <div className='max-w-[280px]'>
                  <p className='text-base font-bold text-foreground'>{t('empty.title')}</p>
                  <p className='mt-1.5 text-sm text-muted-foreground leading-relaxed'>
                    {t('empty.subtitle')}
                  </p>
                </div>
              </div>
            ) : (
              <div className='divide-y divide-primary/10'>
                {properties.map((property) => (
                  <div
                    key={property.property_id}
                    className='transition-colors hover:bg-primary/5'
                  >
                    <OwnerPropertyCard
                      property={property}
                      isSelected={selectedProperty?.property_id === property.property_id}
                      onClick={handlePropertyClick}
                      listingType={listingType}
                    />
                  </div>
                ))}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className='h-2' />

                {isFetchingNextPage && (
                  <div className='flex justify-center py-6'>
                    <div className='h-6 w-6 animate-spin rounded-full border-4 border-primary/10 border-t-primary' />
                  </div>
                )}

                {!hasNextPage && properties.length > 0 && (
                  <div className='py-6 text-center text-xs font-medium text-muted-foreground/40 uppercase tracking-wider'>
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
          'flex-1 overflow-y-auto bg-primary/5',
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
          <div className='flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500'>
            <div className='mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border border-primary/20'>
              <Building className='h-10 w-10 text-primary/30' strokeWidth={1.5} />
            </div>
            <p className='text-base font-medium text-muted-foreground max-w-[250px]'>
              {t('empty.selectProperty')}
            </p>
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
