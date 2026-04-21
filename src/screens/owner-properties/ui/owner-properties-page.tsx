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
import { formatNumber } from '@/shared/lib/utils/format-currency';
import { Search, Home, Filter, X, DollarSign, Building, ChevronDown } from 'lucide-react';
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
  const { listingType, setListingType, totalElements } = useOwnerPropertiesContext();

  return (
    <div className='flex gap-1 min-w-max'>
      <button
        type='button'
        onClick={() => setListingType('ALL')}
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          listingType === 'ALL'
            ? 'bg-primary text-white'
            : 'bg-transparent text-foreground/70 hover:bg-primary/5'
        )}
      >
        {t('tabs.all')}
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-bold',
            listingType === 'ALL' ? 'bg-white/20 text-white' : 'bg-primary/15 text-foreground'
          )}
        >
          {formatNumber(totalElements)}
        </span>
      </button>
      <button
        type='button'
        onClick={() => setListingType('SELL')}
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          listingType === 'SELL'
            ? 'bg-primary text-white'
            : 'bg-transparent text-foreground/70 hover:bg-primary/5'
        )}
      >
        {t('tabs.sell')}
      </button>
      <button
        type='button'
        onClick={() => setListingType('RENT')}
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          listingType === 'RENT'
            ? 'bg-primary text-white'
            : 'bg-transparent text-foreground/70 hover:bg-primary/5'
        )}
      >
        {t('tabs.rent')}
      </button>
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
  const filterRef = useRef<HTMLDivElement>(null);
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
      <div className='flex h-full items-center justify-center p-4 sm:p-6'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary/10 border-t-primary' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-full items-center justify-center p-4 sm:p-6'>
        <div className='flex max-w-xs flex-col items-center gap-3 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Home className='h-6 w-6 text-primary' />
          </div>
          <p className='font-semibold text-foreground'>{t('error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full overflow-hidden flex-col sm:flex-row'>
      {/* ── Left Sidebar ── */}
      <aside
        className={cn(
          'flex-col border-r border-primary/20 bg-white transition-all duration-300',
          isMobile ? (selectedProperty ? 'hidden' : 'flex w-full') : 'flex w-[460px]'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-b border-primary/20 p-4 sm:p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h2 className='text-xl font-bold text-foreground'>{t('pageTitle')}</h2>
                <div className='flex items-center justify-center rounded-full bg-primary px-2 py-0.5'>
                  <span className='text-sm font-bold text-white'>{totalElements}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className='border-b border-primary/20 px-4 sm:px-6 pt-4 overflow-x-auto no-scrollbar'>
            <ListingTypeTabs />
          </div>

          {/* Search bar + Filter button (same row) */}
          <div className='border-b border-primary/20 p-4 sm:p-6'>
            <div className='flex items-center gap-3'>
              {/* Search input */}
              <div className='relative flex-1'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                  <Search className='h-5 w-5 text-muted-foreground/70' strokeWidth={2} />
                </div>
                <Input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('filter.searchPlaceholder')}
                  className='h-12 w-full rounded-lg border-2 border-primary/20 bg-primary/5 pl-12 pr-4 text-base font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-0'
                />
              </div>

              {/* Filter icon button */}
              <div ref={filterRef} className='relative shrink-0'>
                <button
                  onClick={() => setFilterOpen((v) => !v)}
                  className={cn(
                    'relative flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    filterOpen
                      ? 'border-primary bg-primary/5 text-primary'
                      : activeFilterCount > 0
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-primary/20 bg-white text-foreground hover:bg-primary/5'
                  )}
                  aria-label={t('filter.title')}
                >
                  <Filter className='h-5 w-5' strokeWidth={2} />
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', filterOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                  {activeFilterCount > 0 && (
                    <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable content: Filter Panel + Properties List */}
          <div className='flex-1 overflow-y-auto'>
            {/* Collapsible Filter Panel — inside scroll area so price inputs are reachable */}
            {filterOpen && <FilterPanel isOpen={filterOpen} onClose={() => setFilterOpen(false)} />}

            {/* Properties List */}
            {properties.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-4 p-12 text-center'>
                <div className='flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/10'>
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
          <div className='flex h-full flex-col items-center justify-center p-8 text-center'>
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
