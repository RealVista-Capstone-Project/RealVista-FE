'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PropertyFeedProvider,
  usePropertyFeedContext,
  type ListingType,
} from '@/features/agent-proposal/model/property-feed-context';
import { OwnerPropertyCard } from '@/features/agent-proposal/ui/owner-property-card';
import { AgentApplyProposalModal } from '@/features/agent-proposal/ui/agent-apply-proposal-modal';
import { useAgentProposalCtaForOwnerProperty } from '@/features/agent-proposal/hooks/use-agent-proposal-cta-for-owner-property';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { formatNumber, formatVND } from '@/shared/lib/utils/format-currency';
import { Search, Home, Filter, X, DollarSign, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import type { OwnerPropertySummary } from '@/entities/property';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatInputNumber(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('vi-VN');
}

function parseInputNumber(value: string): number | undefined {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return undefined;
  const n = parseInt(digits, 10);
  return isNaN(n) ? undefined : n;
}

function normalizeAddress(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function compactAddressForMatching(value: string | null | undefined): string {
  return normalizeAddress(value).replace(/[^a-z0-9]/g, '');
}

function isFlexibleAddressMatch(
  leftAddress: string | null | undefined,
  rightAddress: string | null | undefined
): boolean {
  const left = compactAddressForMatching(leftAddress);
  const right = compactAddressForMatching(rightAddress);
  if (!left || !right) return false;
  // Guard against accidental broad matches for very short fragments.
  if (left.length < 8 || right.length < 8) return left === right;
  return left.includes(right) || right.includes(left);
}

const RETURN_TO_APPLY_INTENT_STORAGE_KEY = 'agent-proposal:return-to-apply-intent';
const RETURN_TO_APPLY_INTENT_MAX_AGE_MS = 30 * 60 * 1000;

interface ReturnToApplyIntent {
  propertyId?: string;
  propertyAddress?: string;
  source: 'manage-proposals';
  ts: number;
}

function readReturnToApplyIntent(): ReturnToApplyIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawValue = window.localStorage.getItem(RETURN_TO_APPLY_INTENT_STORAGE_KEY);
    if (!rawValue) return null;
    const parsedValue = JSON.parse(rawValue) as Partial<ReturnToApplyIntent>;
    if (parsedValue.source !== 'manage-proposals') return null;
    if (typeof parsedValue.propertyId !== 'undefined' && typeof parsedValue.propertyId !== 'string') return null;
    if (typeof parsedValue.propertyAddress !== 'undefined' && typeof parsedValue.propertyAddress !== 'string') return null;
    if (!parsedValue.propertyId && !parsedValue.propertyAddress) return null;
    if (typeof parsedValue.ts !== 'number') return null;
    if (Date.now() - parsedValue.ts > RETURN_TO_APPLY_INTENT_MAX_AGE_MS) return null;
    return {
      propertyAddress: parsedValue.propertyAddress,
      propertyId: parsedValue.propertyId,
      source: 'manage-proposals',
      ts: parsedValue.ts,
    };
  } catch {
    return null;
  }
}

function clearReturnToApplyIntent() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(RETURN_TO_APPLY_INTENT_STORAGE_KEY);
    // Legacy cleanup for older session-based intent writes.
    window.sessionStorage.removeItem(RETURN_TO_APPLY_INTENT_STORAGE_KEY);
  } catch {
    // Ignore storage failures - URL cleanup still prevents repeat auto-open.
  }
}

interface LocalPriceFilter {
  minRentPrice: string;
  maxRentPrice: string;
  minBuyPrice: string;
  maxBuyPrice: string;
}

// ── Listing-type tabs ─────────────────────────────────────────────────────────

function ListingTypeTabs() {
  const t = useTranslations('PropertyFeed');
  const { listingType, setListingType, totalElements } = usePropertyFeedContext();

  const tabs: { key: ListingType; label: string; showCount?: boolean }[] = [
    { key: 'ALL', label: t('tabs.all'), showCount: true },
    { key: 'SELL', label: t('tabs.sell') },
    { key: 'RENT', label: t('tabs.rent') },
  ];

  return (
    <div className='flex gap-1 min-w-max'>
      {tabs.map(({ key, label, showCount }) => (
        <button
          key={key}
          type='button'
          onClick={() => setListingType(key)}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            listingType === key
              ? 'bg-primary text-white shadow-sm'
              : 'text-foreground/60 hover:bg-primary/5 hover:text-foreground'
          )}
        >
          {label}
          {showCount && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold',
                listingType === key ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
              )}
            >
              {formatNumber(totalElements)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Filter panel (shared content) ─────────────────────────────────────────────

interface FilterContentProps {
  onApply?: () => void;
}

function FilterContent({ onApply }: FilterContentProps) {
  const t = useTranslations('PropertyFeed');
  const {
    priceFilter,
    setPriceFilter,
    listingType,
    propertyTypeId,
    setPropertyTypeId,
    availablePropertyTypes,
    isLoadingPropertyTypes,
  } = usePropertyFeedContext();

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
    setPriceFilter({
      minRentPrice: parseInputNumber(localFilter.minRentPrice),
      maxRentPrice: parseInputNumber(localFilter.maxRentPrice),
      minBuyPrice: parseInputNumber(localFilter.minBuyPrice),
      maxBuyPrice: parseInputNumber(localFilter.maxBuyPrice),
    });
    onApply?.();
  };

  const handleReset = () => {
    setLocalFilter({ minRentPrice: '', maxRentPrice: '', minBuyPrice: '', maxBuyPrice: '' });
    setPriceFilter({});
    setPropertyTypeId(null);
  };

  const handlePriceChange = (key: keyof LocalPriceFilter, value: string) => {
    setLocalFilter((prev) => ({ ...prev, [key]: formatInputNumber(value) }));
  };

  const showRentFilter = listingType === 'ALL' || listingType === 'RENT';
  const showBuyFilter = listingType === 'ALL' || listingType === 'SELL';
  const priceInputClass = 'h-9 rounded-lg text-sm text-right tabular-nums';

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

  return (
    <div className='flex flex-col gap-6 h-full'>
      {/* Property type */}
      <div className='space-y-3'>
        <label className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider'>
          {t('filter.propertyType')}
        </label>
        {isLoadingPropertyTypes ? (
          <div className='flex flex-wrap gap-2'>
            {[80, 100, 70, 110, 90].map((w, i) => (
              <div
                key={i}
                className='h-7 rounded-full bg-muted animate-pulse'
                style={{ width: w }}
              />
            ))}
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='flex flex-wrap gap-2'>
              <button
                onClick={() => setPropertyTypeId(null)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150',
                  propertyTypeId === null
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:bg-primary/5'
                )}
              >
                {t('filter.allTypes')}
              </button>
            </div>
            {typesByCategory.map((group) => (
              <div key={group.categoryName} className='space-y-1.5'>
                <span className='text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest'>
                  {group.categoryName}
                </span>
                <div className='flex flex-wrap gap-2'>
                  {group.types.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPropertyTypeId(propertyTypeId === type.id ? null : type.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150',
                        propertyTypeId === type.id
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:bg-primary/5'
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

      {/* Rent price */}
      {showRentFilter && (
        <div className='space-y-2'>
          <label className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
            <DollarSign className='h-3.5 w-3.5 text-emerald-500' />
            {t('filter.rentPrice')}
          </label>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              inputMode='numeric'
              placeholder={`${t('filter.min')} (${t('filter.rentPrice')})`}
              value={localFilter.minRentPrice}
              onChange={(e) => handlePriceChange('minRentPrice', e.target.value)}
              className={cn(priceInputClass, rentError && 'border-red-400 focus:border-red-400')}
            />
            <Input
              inputMode='numeric'
              placeholder={`${t('filter.max')} (${t('filter.rentPrice')})`}
              value={localFilter.maxRentPrice}
              onChange={(e) => handlePriceChange('maxRentPrice', e.target.value)}
              className={cn(priceInputClass, rentError && 'border-red-400 focus:border-red-400')}
            />
          </div>
          {!!(localFilter.minRentPrice || localFilter.maxRentPrice) && (
            <p className='text-[11px] text-muted-foreground tabular-nums'>
              {localFilter.minRentPrice
                ? formatVND(parseInputNumber(localFilter.minRentPrice) ?? 0)
                : t('filter.min')}{' '}
              -{' '}
              {localFilter.maxRentPrice
                ? formatVND(parseInputNumber(localFilter.maxRentPrice) ?? 0)
                : t('filter.max')}
            </p>
          )}
          {rentError && <p className='text-xs text-red-500'>{rentError}</p>}
        </div>
      )}

      {/* Buy price */}
      {showBuyFilter && (
        <div className='space-y-2'>
          <label className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
            <DollarSign className='h-3.5 w-3.5 text-blue-500' />
            {t('filter.buyPrice')}
          </label>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              inputMode='numeric'
              placeholder={`${t('filter.min')} (${t('filter.buyPrice')})`}
              value={localFilter.minBuyPrice}
              onChange={(e) => handlePriceChange('minBuyPrice', e.target.value)}
              className={cn(priceInputClass, buyError && 'border-red-400 focus:border-red-400')}
            />
            <Input
              inputMode='numeric'
              placeholder={`${t('filter.max')} (${t('filter.buyPrice')})`}
              value={localFilter.maxBuyPrice}
              onChange={(e) => handlePriceChange('maxBuyPrice', e.target.value)}
              className={cn(priceInputClass, buyError && 'border-red-400 focus:border-red-400')}
            />
          </div>
          {!!(localFilter.minBuyPrice || localFilter.maxBuyPrice) && (
            <p className='text-[11px] text-muted-foreground tabular-nums'>
              {localFilter.minBuyPrice
                ? formatVND(parseInputNumber(localFilter.minBuyPrice) ?? 0)
                : t('filter.min')}{' '}
              -{' '}
              {localFilter.maxBuyPrice
                ? formatVND(parseInputNumber(localFilter.maxBuyPrice) ?? 0)
                : t('filter.max')}
            </p>
          )}
          {buyError && <p className='text-xs text-red-500'>{buyError}</p>}
        </div>
      )}

      {/* Actions */}
      <div className='flex gap-2 mt-auto pt-4 border-t border-border'>
        <Button
          onClick={handleApply}
          disabled={hasError}
          className='flex-1 h-9 rounded-lg text-sm font-semibold'
        >
          {t('filter.apply')}
        </Button>
        <Button
          variant='outline'
          onClick={handleReset}
          className='h-9 px-3 rounded-lg border-border'
          title={t('filter.clearAll')}
        >
          <X className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

// ── Filter sidebar (desktop always-visible) ───────────────────────────────────

function FilterSidebar() {
  const t = useTranslations('PropertyFeed');
  const { priceFilter, propertyTypeId } = usePropertyFeedContext();

  const activeFilterCount =
    [
      priceFilter.minRentPrice,
      priceFilter.maxRentPrice,
      priceFilter.minBuyPrice,
      priceFilter.maxBuyPrice,
    ].filter(Boolean).length + (propertyTypeId ? 1 : 0);

  return (
    <aside className='hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-r border-border bg-background h-full'>
      {/* Sidebar header */}
      <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
        <div className='flex items-center gap-2'>
          <SlidersHorizontal className='h-4 w-4 text-primary' />
          <span className='text-sm font-bold text-foreground'>{t('filter.title')}</span>
        </div>
        {activeFilterCount > 0 && (
          <span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white'>
            {activeFilterCount}
          </span>
        )}
      </div>

      {/* Scrollable filter content */}
      <div className='flex-1 overflow-y-auto px-5 py-5'>
        <FilterContent />
      </div>
    </aside>
  );
}

// ── Mobile filter sheet (via Sheet component) ─────────────────────────────────

function MobileFilterSheet() {
  const t = useTranslations('PropertyFeed');
  const { priceFilter, propertyTypeId } = usePropertyFeedContext();
  const [open, setOpen] = useState(false);

  const activeFilterCount =
    [
      priceFilter.minRentPrice,
      priceFilter.maxRentPrice,
      priceFilter.minBuyPrice,
      priceFilter.maxBuyPrice,
    ].filter(Boolean).length + (propertyTypeId ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            'relative flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
            activeFilterCount > 0
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-background text-foreground hover:bg-muted'
          )}
        >
          <Filter className='h-4 w-4' />
          <span className='hidden sm:inline'>{t('filter.title')}</span>
          <ChevronDown className='h-3 w-3' />
          {activeFilterCount > 0 && (
            <span className='absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
              {activeFilterCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side='left' className='w-80 flex flex-col'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <SlidersHorizontal className='h-4 w-4 text-primary' />
            {t('filter.title')}
          </SheetTitle>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto py-4'>
          <FilterContent onApply={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Per-card proposal CTA wrapper ─────────────────────────────────────────────

function PropertyCardWithProposal({
  property,
  listingType,
  autoOpenPropertyId,
  autoOpenPropertyAddress,
  onAutoOpenHandled,
}: {
  property: OwnerPropertySummary;
  listingType: ListingType;
  autoOpenPropertyId?: string | null;
  autoOpenPropertyAddress?: string | null;
  onAutoOpenHandled?: (property: Pick<OwnerPropertySummary, 'property_id' | 'street_address'>) => void;
}) {
  const {
    isAgent,
    isApplyModalOpen,
    setIsApplyModalOpen,
    cannotApplyProposal,
    openApplyModal,
    onApplySubmitSuccess,
    propertyId,
  } = useAgentProposalCtaForOwnerProperty(property);

  // Merge backend "cannot apply" state with local property flag
  const alreadyProposed = cannotApplyProposal || property.has_active_proposal;
  const confirmedHandledTargetRef = useRef<string | null>(null);
  const pendingAutoOpenAcknowledgeRef = useRef<Pick<
    OwnerPropertySummary,
    'property_id' | 'street_address'
  > | null>(null);

  useEffect(() => {
    // Legacy auto-open logic removed in favor of page-level handling in PropertyFeedContent
  }, []);

  useEffect(() => {
    if (!isApplyModalOpen) return;
    const pendingTarget = pendingAutoOpenAcknowledgeRef.current;
    if (!pendingTarget) return;
    const handledToken = autoOpenPropertyId ?? normalizeAddress(autoOpenPropertyAddress);
    confirmedHandledTargetRef.current = handledToken;
    pendingAutoOpenAcknowledgeRef.current = null;
    onAutoOpenHandled?.(pendingTarget);
  }, [isApplyModalOpen, onAutoOpenHandled, autoOpenPropertyId, autoOpenPropertyAddress]);

  return (
    <>
      <OwnerPropertyCard
        property={alreadyProposed ? { ...property, has_active_proposal: true } : property}
        variant='grid'
        listingType={listingType}
        isAgent={isAgent}
        onPropose={openApplyModal}
      />
      {isAgent && isApplyModalOpen && (
        <AgentApplyProposalModal
          propertyId={propertyId}
          propertyAddress={property.street_address}
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onSubmitSuccess={onApplySubmitSuccess}
        />
      )}
    </>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function PropertyFeedContent() {
  const searchParams = useSearchParams();
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
    totalElements,
  } = usePropertyFeedContext();

  const t = useTranslations('PropertyFeed');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [shouldAutoOpenFromUrl, setShouldAutoOpenFromUrl] = useState(false);
  const [pendingReturnPropertyId, setPendingReturnPropertyId] = useState<string | null>(null);
  const [pendingReturnPropertyAddress, setPendingReturnPropertyAddress] = useState<string | null>(null);
  const [settledSearchQuery, setSettledSearchQuery] = useState<string | null>(null);
  const [autoOpenModalTarget, setAutoOpenModalTarget] = useState<OwnerPropertySummary | null>(null);
  const lastFetchAttemptTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const shouldOpenApplyModal = params.get('openApplyModal') === '1' || params.get('autoOpen') === '1';
    const targetPropertyId = params.get('propertyId') || params.get('openPropertyId');
    const targetPropertyAddress = params.get('propertyAddress');

    console.log('PropertyFeed: checking URL params', { shouldOpenApplyModal, targetPropertyId, targetPropertyAddress });
    if (shouldOpenApplyModal && (targetPropertyId || targetPropertyAddress)) {
      setShouldAutoOpenFromUrl(true);
      setPendingReturnPropertyId(targetPropertyId);
      setPendingReturnPropertyAddress(targetPropertyAddress ?? null);
      if (targetPropertyAddress) {
        setSearchQuery(targetPropertyAddress);
      }
      return;
    }

    const fallbackIntent = readReturnToApplyIntent();
    if (!fallbackIntent) {
      clearReturnToApplyIntent();
      setShouldAutoOpenFromUrl(false);
      return;
    }

    setShouldAutoOpenFromUrl(true);
    setPendingReturnPropertyId(fallbackIntent.propertyId ?? null);
    setPendingReturnPropertyAddress(fallbackIntent.propertyAddress ?? null);
    if (fallbackIntent.propertyAddress) {
      setSearchQuery(fallbackIntent.propertyAddress);
    }
  }, [searchParams, setSearchQuery]);

  useEffect(() => {
    if (!isLoading) {
      setSettledSearchQuery(searchQuery);
    }
  }, [isLoading, searchQuery]);

  useEffect(() => {
    if (!shouldAutoOpenFromUrl) return;
    if (!pendingReturnPropertyId && !pendingReturnPropertyAddress) return;
    if (settledSearchQuery !== searchQuery) return;

    const targetKey = pendingReturnPropertyId ?? normalizeAddress(pendingReturnPropertyAddress);
    const targetProperty = properties.find(
      (p) =>
        pendingReturnPropertyId
          ? p.property_id === pendingReturnPropertyId
          : isFlexibleAddressMatch(p.street_address, pendingReturnPropertyAddress)
    );

    if (targetProperty) {
      lastFetchAttemptTargetRef.current = null;
      if (!autoOpenModalTarget) {
        setAutoOpenModalTarget(targetProperty);
      }
    } else {
      if (hasNextPage && !isFetchingNextPage) {
        if (lastFetchAttemptTargetRef.current === targetKey) return;
        lastFetchAttemptTargetRef.current = targetKey;
        fetchNextPage();
        return;
      }

      if (isFetchingNextPage) return;
      if (!hasNextPage) {
        lastFetchAttemptTargetRef.current = null;
        clearReturnToApplyIntent();
        setShouldAutoOpenFromUrl(false);
        setPendingReturnPropertyId(null);
        setPendingReturnPropertyAddress(null);
      }
    }
  }, [shouldAutoOpenFromUrl, pendingReturnPropertyId, pendingReturnPropertyAddress, properties, hasNextPage, isFetchingNextPage, fetchNextPage, settledSearchQuery, searchQuery, autoOpenModalTarget]);

  useEffect(() => {
    if (!isFetchingNextPage) {
      lastFetchAttemptTargetRef.current = null;
    }
  }, [isFetchingNextPage]);

  const handleAutoOpenHandled = ({
    property_id,
    street_address,
  }: Pick<OwnerPropertySummary, 'property_id' | 'street_address'>) => {
    if (typeof window === 'undefined') return;
    if (!shouldAutoOpenFromUrl) return;
    if (!pendingReturnPropertyId && !pendingReturnPropertyAddress) return;

    const matchesTarget = pendingReturnPropertyId
      ? pendingReturnPropertyId === property_id
      : isFlexibleAddressMatch(pendingReturnPropertyAddress, street_address);
    if (!matchesTarget) return;

    clearReturnToApplyIntent();
    setShouldAutoOpenFromUrl(false);
    setPendingReturnPropertyId(null);
    setPendingReturnPropertyAddress(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('openApplyModal');
    params.delete('propertyId');
    params.delete('propertyAddress');
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  };

  // Infinite scroll
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

  return (
    <div className='flex h-full overflow-hidden'>
      {/* ── Left filter sidebar (desktop) ── */}
      <FilterSidebar />

      {/* ── Right: search + grid ── */}
      <div className='flex flex-1 flex-col min-w-0 overflow-hidden'>
        {/* Top bar: tabs + search + mobile filter */}
        <div className='flex-shrink-0 border-b border-border bg-background px-4 sm:px-6 py-3 space-y-3'>
          {/* Row 1: tabs */}
          <div className='overflow-x-auto no-scrollbar'>
            <ListingTypeTabs />
          </div>

          {/* Row 2: search + mobile filter button */}
          <div className='flex items-center gap-3'>
            <div className='relative flex-1'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
                <Search className='h-4 w-4 text-muted-foreground/60' strokeWidth={2} />
              </div>
              <Input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('filter.searchPlaceholder')}
                className='h-10 pl-10 rounded-lg border-border bg-muted/40 focus:bg-background text-sm'
              />
            </div>

            {/* Mobile filter trigger */}
            <div className='lg:hidden'>
              <MobileFilterSheet />
            </div>

            {/* Result count */}
            <span className='hidden md:block flex-shrink-0 text-xs text-muted-foreground font-medium whitespace-nowrap'>
              {t('filter.resultCount', { count: formatNumber(totalElements) })}
            </span>
          </div>
        </div>

        {/* Scrollable grid area */}
        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary/10 border-t-primary' />
            </div>
          ) : isError ? (
            <div className='flex h-64 flex-col items-center justify-center gap-3 text-center px-4'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
                <Home className='h-6 w-6 text-destructive' />
              </div>
              <p className='font-semibold text-foreground'>{t('error')}</p>
            </div>
          ) : properties.length === 0 ? (
            <div className='flex h-64 flex-col items-center justify-center gap-4 text-center px-4'>
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 border border-primary/10'>
                <Home className='h-8 w-8 text-primary/30' strokeWidth={1.5} />
              </div>
              <div>
                <p className='font-bold text-foreground'>{t('empty.title')}</p>
                <p className='mt-1 text-sm text-muted-foreground'>{t('empty.subtitle')}</p>
              </div>
            </div>
          ) : (
            <div className='p-4 sm:p-6'>
              {/* 3-column grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                {properties.map((property) => (
                  <PropertyCardWithProposal
                    key={property.property_id}
                    property={property}
                    listingType={listingType}
                    autoOpenPropertyId={shouldAutoOpenFromUrl ? pendingReturnPropertyId : null}
                    autoOpenPropertyAddress={shouldAutoOpenFromUrl ? pendingReturnPropertyAddress : null}
                    onAutoOpenHandled={handleAutoOpenHandled}
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className='h-4 mt-2' />

              {isFetchingNextPage && (
                <div className='flex justify-center py-8'>
                  <div className='h-6 w-6 animate-spin rounded-full border-4 border-primary/10 border-t-primary' />
                </div>
              )}

              {!hasNextPage && properties.length > 0 && (
                <p className='py-8 text-center text-xs font-medium text-muted-foreground/40 uppercase tracking-wider'>
                  {t('empty.endOfList')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Page-level auto-open modal */}
        {autoOpenModalTarget && (
          <AgentApplyProposalModal
            propertyId={autoOpenModalTarget.property_id}
            propertyAddress={autoOpenModalTarget.street_address}
            isOpen={true}
            onClose={() => {
              setAutoOpenModalTarget(null);
              handleAutoOpenHandled(autoOpenModalTarget);
            }}
            onSubmitSuccess={() => {
              setAutoOpenModalTarget(null);
              handleAutoOpenHandled(autoOpenModalTarget);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export function PropertyFeedPage() {
  return (
    <PropertyFeedProvider>
      <PropertyFeedContent />
    </PropertyFeedProvider>
  );
}
