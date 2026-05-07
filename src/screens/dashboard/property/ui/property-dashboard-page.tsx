'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Search,
  Filter,
  X,
  ChevronDown,
  Edit,
  Home,
  Box,
  MapPin,
  Ruler,
  Building,
  Building2,
  ArrowUpDown,
  Cuboid,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

import { Link, useRouter } from '@/shared/config/i18n/navigation';
import { useAuthSession } from '@/features/auth/model';
import { useQuery } from '@tanstack/react-query';
import { propertyQueries } from '@/entities/property/api/property.queries';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { ThreeDPromoBanner } from '@/widgets/billing';
import { formatVND, formatNumber } from '@/shared/lib/utils/format-currency';
import { cn } from '@/shared/lib/utils';
import { Spinner } from '@/shared/ui/spinner';
import { RealVistaPagination } from '@/shared/ui/realvista-pagination/realvista-pagination';
import type {
  PropertySummaryResponse,
  PropertyMediaItem,
} from '@/entities/property/api/property-api.types';

const PROPERTY_STATUSES = [
  'DRAFT',
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'AVAILABLE',
  'RESERVED',
  'SOLD',
  'RENTED',
] as const;

const SHOWCASE_TYPE_CODES = ['HOUSE', 'VILLA', 'TOWNHOUSE', 'SHOPHOUSE'] as const;

type ShowcaseCode = (typeof SHOWCASE_TYPE_CODES)[number];

const CARD_VISUAL: Record<
  string,
  { Icon: typeof Home }
> = {
  SHOPHOUSE: { Icon: Building },
  HOUSE: { Icon: Home },
  VILLA: { Icon: Building2 },
  TOWNHOUSE: { Icon: Building },
  DEFAULT: { Icon: Building2 },
};

function formatCardPrice(property: PropertySummaryResponse): string {
  const pr = property.price_range;
  if (!pr) return '—';
  const buyMin = pr.buy?.min;
  const buyMax = pr.buy?.max;
  const rentMin = pr.rent?.min;
  const rentMax = pr.rent?.max;
  if (buyMin != null && buyMax != null) {
    return `${formatVND(Number(buyMin))} – ${formatVND(Number(buyMax))}`;
  }
  if (buyMin != null) return formatVND(Number(buyMin));
  if (buyMax != null) return formatVND(Number(buyMax));
  if (rentMin != null && rentMax != null) {
    return `${formatVND(Number(rentMin))} – ${formatVND(Number(rentMax))}`;
  }
  if (rentMin != null) return formatVND(Number(rentMin));
  if (rentMax != null) return formatVND(Number(rentMax));
  return '—';
}

function hasDisplayableCardPrice(property: PropertySummaryResponse): boolean {
  const pr = property.price_range;
  if (!pr) return false;
  if (pr.buy?.min != null || pr.buy?.max != null) return true;
  if (pr.rent?.min != null || pr.rent?.max != null) return true;
  return false;
}

function PropertyPortfolioGridCard({ property }: { property: PropertySummaryResponse }) {
  const t = useTranslations('PropertyDashboard');
  const router = useRouter();
  const code = property.property_type_info?.property_type_code ?? '';
  const visual = CARD_VISUAL[code] ?? CARD_VISUAL.DEFAULT;
  const Vi = visual.Icon;

  const thumbnailUrl =
    property.thumbnail_url ??
    property.media?.find((m: PropertyMediaItem) => m.is_primary)?.media_url ??
    property.media?.[0]?.media_url;

  const location = [property.location_info?.district_name, property.location_info?.city_name]
    .filter(Boolean)
    .join(', ');

  const typeLabel =
    property.property_type_info?.property_type_name ?? property.property_type_info?.property_category_name ?? '—';

  const showPrice = hasDisplayableCardPrice(property);

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('a[href]')) return;
    router.push(`/dashboard/property/${property.property_id}`);
  }

  function handleCardKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    router.push(`/dashboard/property/${property.property_id}`);
  }

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        'group flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-primary/15 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
      )}
    >
      <div className='relative h-36 overflow-hidden bg-muted'>
        {thumbnailUrl ? (
          <Image src={thumbnailUrl} alt='' fill className='object-cover' />
        ) : (
          <Vi
            className='pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/25'
            strokeWidth={1.25}
          />
        )}
        <div className='absolute inset-x-0 top-0 flex items-start p-3'>
          <div className='flex min-w-0 max-w-full flex-col items-start gap-1.5'>
            <span className='max-w-full break-words rounded-lg bg-black/35 px-2.5 py-1 text-left text-[11px] font-bold leading-snug text-white backdrop-blur-sm'>
              {typeLabel}
            </span>
            <span
              className={cn(
                'max-w-full break-words rounded-lg px-2.5 py-1 text-left text-[10px] font-bold leading-snug backdrop-blur-sm',
                property.status === 'AVAILABLE'
                  ? 'bg-primary/90 text-white'
                  : property.status === 'PENDING'
                    ? 'bg-amber-500/90 text-white'
                    : 'bg-black/45 text-white'
              )}
            >
              {t(`status${property.status}` as Parameters<typeof t>[0])}
            </span>
          </div>
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-2.5 p-4'>
        <div className='flex items-start justify-between gap-2'>
          <h3 className='line-clamp-2 text-base font-bold leading-snug text-foreground group-hover:text-primary'>
            {property.street_address}
          </h3>
          <Link
            href={`/dashboard/property/${property.property_id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className='shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-primary/15 bg-white text-primary transition-colors hover:bg-primary/5'
            aria-label={t('editAction')}
          >
            <Edit className='h-3.5 w-3.5' strokeWidth={2} />
          </Link>
        </div>
        {location ? (
          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <MapPin className='h-3.5 w-3.5 shrink-0' />
            <span className='line-clamp-1'>{location}</span>
          </div>
        ) : null}
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/75'>
          {property.land_size_m2 != null && (
            <span className='inline-flex items-center gap-1'>
              <Ruler className='h-3.5 w-3.5' />
              {property.land_size_m2} m²
            </span>
          )}
          {property.width_m != null && property.length_m != null && (
            <span className='inline-flex items-center gap-1'>
              <Box className='h-3.5 w-3.5' />
              {property.width_m} × {property.length_m} m
            </span>
          )}
          {property.has_3d && (
            <span className='inline-flex items-center gap-1 font-semibold text-emerald-600'>
              <Box className='h-3.5 w-3.5' /> 3D
            </span>
          )}
        </div>
        <div
          className={cn(
            'mt-auto flex items-center gap-2 border-t border-primary/10 pt-3',
            showPrice ? 'justify-between' : 'justify-end'
          )}
        >
          {showPrice ? (
            <p className='text-sm font-bold text-primary'>{formatCardPrice(property)}</p>
          ) : null}
          <div className='flex items-center gap-1.5'>
            {property.has_3d ? (
              <Link
                href={`/dashboard/property/${property.property_id}/3d`}
                onClick={(e) => e.stopPropagation()}
                className='flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-white text-primary transition-colors hover:bg-primary/5'
                aria-label={t('3dAction')}
                title={t('threeDDotTooltip')}
              >
                <Cuboid className='h-4 w-4' strokeWidth={2} />
              </Link>
            ) : (
              <Link
                href={`/dashboard/property/${property.property_id}/3d`}
                onClick={(e) => e.stopPropagation()}
                className='group relative inline-flex items-center gap-1 overflow-hidden rounded-2xl px-2.5 py-1.5 text-[11px] font-semibold transition-all hover:scale-105'
                style={{
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(254,243,199,0.75) 40%, rgba(253,230,138,0.65) 100%)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.7)',
                  animation: 'borderBlinkYellow 2.5s ease-in-out infinite',
                }}
                aria-label={t('add3dAction')}
                title={t('add3dTooltip')}
              >
                <style>{`
                  @keyframes borderBlinkYellow {
                    0%, 100% {
                      box-shadow: 0 0 0 1px rgba(253,230,138,0.3), 0 0 8px 2px rgba(253,230,138,0.2), inset 0 1px 0 rgba(255,255,255,0.8);
                      border-color: rgba(255,255,255,0.7);
                    }
                    50% {
                      box-shadow: 0 0 0 1.5px rgba(245,158,11,0.7), 0 0 16px 4px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.9);
                      border-color: rgba(253,230,138,0.95);
                    }
                  }
                  @keyframes shimmerYellow {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(300%) skewX(-15deg); }
                  }
                  @keyframes iconBlinkYellow {
                    0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
                    50% { opacity: 0.6; transform: scale(1.2) rotate(15deg); }
                  }
                `}</style>
                <span
                  className='pointer-events-none absolute inset-0 w-1/4'
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    animation: 'shimmerYellow 2.4s ease-in-out infinite',
                  }}
                />
                <Sparkles
                  className='relative h-3 w-3 shrink-0 text-amber-600'
                  style={{ animation: 'iconBlinkYellow 1.6s ease-in-out infinite' }}
                />
                <span className='relative text-amber-700'>{t('add3dAction')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type SortOption =
  | 'NEWEST'
  | 'OLDEST'
  | 'AREA_ASC'
  | 'AREA_DESC'
  | 'ADDRESS_ASC'
  | 'ADDRESS_DESC';

function metricNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function PropertyDashboardPage() {
  const t = useTranslations('PropertyDashboard');
  const { data: session } = useAuthSession();
  const backendRoles = React.useMemo(() => session?.user?.backendRoles ?? [], [session?.user?.backendRoles]);
  const isAgentUser =
    String(session?.user?.role ?? '').toUpperCase() === 'AGENT' || backendRoles.includes('AGENT');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showcaseFilter, setShowcaseFilter] = useState<'ALL' | ShowcaseCode>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const statusRef = React.useRef<HTMLDivElement>(null);
  const sortRef = React.useRef<HTMLDivElement>(null);
  const typeRef = React.useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 12;

  const { data: propertyTypesData } = useQuery(propertyQueries.propertyTypes());
  const showcaseIdByCode = React.useMemo(() => {
    const rows = propertyTypesData?.payload?.data ?? [];
    const m = new Map<ShowcaseCode, string>();
    for (const code of SHOWCASE_TYPE_CODES) {
      const row = rows.find((r) => r.property_type_code === code);
      if (row?.property_type_id) m.set(code, row.property_type_id);
    }
    return m;
  }, [propertyTypesData]);

  const { data: metrics } = useQuery(propertyQueries.mySummary());

  const propertyTypeIdFilter =
    showcaseFilter === 'ALL' ? undefined : showcaseIdByCode.get(showcaseFilter);

  const { data: propertiesResponse, isLoading } = useQuery(
    propertyQueries.myProperties({
      keyword: debouncedSearch.trim() || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      property_type_id: propertyTypeIdFilter,
      sort_by: sortBy,
      page,
      size: PAGE_SIZE,
    })
  );

  const properties = propertiesResponse?.payload.data.content || [];
  const totalPages =
    propertiesResponse?.payload.data.total_pages ??
    propertiesResponse?.payload.data.totalPages ??
    0;
  const totalElements =
    propertiesResponse?.payload.data.total_elements ??
    propertiesResponse?.payload.data.totalElements ??
    0;

  const totalPropsMetric = metricNum(metrics?.totalProperties ?? metrics?.total_properties);
  const activePropMetric = metricNum(metrics?.availableProperties ?? metrics?.available_properties);
  const totalLandMetric = metricNum(metrics?.totalLandAreaM2 ?? metrics?.total_land_area_m2);
  const avgLandMetric = metricNum(metrics?.averageLandAreaM2 ?? metrics?.average_land_area_m2);
  const portfolioMetric = metricNum(
    metrics?.estimatedPortfolioValueVnd ?? metrics?.estimated_portfolio_value_vnd
  );
  const yoyPercentRaw =
    metrics?.estimatedPortfolioValueYoyPercent ?? metrics?.estimated_portfolio_value_yoy_percent;
  const yoyPercent = typeof yoyPercentRaw === 'number' && Number.isFinite(yoyPercentRaw) ? yoyPercentRaw : null;

  const publishedListingsMetric = metricNum(
    metrics?.publishedListingsCount ?? metrics?.published_listings_count
  );
  const expiringSoonMetric = metricNum(
    metrics?.listingsExpiringSoonCount ?? metrics?.listings_expiring_soon_count
  );
  const soldPropMetric = metricNum(metrics?.soldProperties ?? metrics?.sold_properties);
  const rentedPropMetric = metricNum(metrics?.rentedProperties ?? metrics?.rented_properties);

  const showcaseCounts =
    metrics?.showcaseTypeCounts ??
    metrics?.showcase_type_counts ??
    ({} as Record<string, number>);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setIsTypeOpen(false);
      }
    }
    if (isStatusOpen || isSortOpen || isTypeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStatusOpen, isSortOpen, isTypeOpen]);

  const resetFilters = () => {
    setStatusFilter('ALL');
    setShowcaseFilter('ALL');
    setSortBy('NEWEST');
    setPage(0);
    setIsStatusOpen(false);
    setIsSortOpen(false);
  };

  const statusOptions = ['ALL', ...PROPERTY_STATUSES] as const;

  const sortOptions: SortOption[] = [
    'NEWEST',
    'OLDEST',
    'AREA_DESC',
    'AREA_ASC',
    'ADDRESS_ASC',
    'ADDRESS_DESC',
  ];

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      <div className='sticky top-0 z-20 border-b border-primary/15 bg-white px-4 pt-3 pb-4 sm:px-6'>
          <div className='flex flex-col gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='relative min-w-[min(100%,220px)] flex-1'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
                  <Search className='h-4 w-4 text-primary/55' strokeWidth={2.5} />
                </div>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder={t('searchPlaceholder')}
                  className='h-9 w-full rounded-full border-2 border-primary/14 bg-white pl-10 pr-9 text-sm font-medium text-foreground shadow-sm shadow-primary/[0.04] placeholder:text-muted-foreground/65 transition-colors focus:border-primary/28 focus:outline-none focus:ring-2 focus:ring-primary/15'
                />
                {searchQuery ? (
                  <button
                    type='button'
                    onClick={() => {
                      setSearchQuery('');
                      setPage(0);
                    }}
                    className='absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground/60 hover:text-foreground focus-visible:outline-none'
                  >
                    <X className='h-3.5 w-3.5' strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>

              <div ref={typeRef} className='relative shrink-0'>
                <button
                  type='button'
                  onClick={() => setIsTypeOpen((v) => !v)}
                  className={cn(
                    'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-2 bg-white px-3 text-xs font-semibold shadow-sm transition-colors',
                    showcaseFilter !== 'ALL'
                      ? 'border-primary/24 text-primary'
                      : 'border-primary/14 text-foreground hover:border-primary/22'
                  )}
                >
                  <Home className='h-4 w-4 text-primary/55' strokeWidth={2} />
                  <span className='max-w-[9rem] truncate'>
                    {showcaseFilter === 'ALL'
                      ? t('typeDropdownPlaceholder')
                      : t(`chipShowcaseShort.${showcaseFilter}` as Parameters<typeof t>[0])}
                  </span>
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 text-primary/50 transition-transform', isTypeOpen && 'rotate-180')}
                    strokeWidth={2.5}
                  />
                </button>
                {isTypeOpen ? (
                  <div className='absolute left-0 top-full z-40 mt-2 w-52 rounded-xl border border-primary/20 bg-white p-2 shadow-lg'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowcaseFilter('ALL');
                        setPage(0);
                        setIsTypeOpen(false);
                      }}
                      className={cn(
                        'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                        showcaseFilter === 'ALL'
                          ? 'bg-primary/5 font-medium text-primary'
                          : 'hover:bg-primary/5'
                      )}
                    >
                      <span>{t('chipAll', { count: formatNumber(totalPropsMetric || totalElements) })}</span>
                    </button>
                    {SHOWCASE_TYPE_CODES.map((code) => {
                      const count = Number(showcaseCounts[code]) || 0;
                      return (
                        <button
                          key={code}
                          type='button'
                          onClick={() => {
                            setShowcaseFilter(code);
                            setPage(0);
                            setIsTypeOpen(false);
                          }}
                          className={cn(
                            'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                            showcaseFilter === code
                              ? 'bg-primary/5 font-medium text-primary'
                              : 'hover:bg-primary/5'
                          )}
                        >
                          <span>{t(`chipShowcaseShort.${code}` as Parameters<typeof t>[0])}</span>
                          {count > 0 && (
                            <span className='ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary'>
                              {formatNumber(count)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div ref={statusRef} className='relative shrink-0'>
                <button
                  type='button'
                  onClick={() => setIsStatusOpen((v) => !v)}
                  className={cn(
                    'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-2 bg-white px-3 text-xs font-semibold shadow-sm transition-colors',
                    statusFilter !== 'ALL'
                      ? 'border-primary/24 text-primary'
                      : 'border-primary/14 text-foreground hover:border-primary/22'
                  )}
                >
                  <Filter className='h-4 w-4 text-primary/55' strokeWidth={2.5} />
                  <span className='max-w-[8rem] truncate'>
                    {statusFilter === 'ALL'
                      ? t('statusDropdownPlaceholder')
                      : t(`status${statusFilter}` as Parameters<typeof t>[0])}
                  </span>
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 text-primary/50 transition-transform', isStatusOpen && 'rotate-180')}
                    strokeWidth={2.5}
                  />
                </button>
                {isStatusOpen ? (
                  <div className='absolute left-0 top-full z-40 mt-2 w-56 rounded-xl border border-primary/20 bg-white p-2 shadow-lg'>
                    {statusOptions.map((s) => (
                      <button
                        key={s}
                        type='button'
                        onClick={() => {
                          setStatusFilter(s);
                          setPage(0);
                          setIsStatusOpen(false);
                        }}
                        className={cn(
                          'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                          statusFilter === s ? 'bg-primary/5 font-medium text-primary' : 'hover:bg-primary/5'
                        )}
                      >
                        {s === 'ALL'
                          ? t('allStatuses')
                          : t(`status${s}` as Parameters<typeof t>[0])}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div ref={sortRef} className='relative shrink-0'>
                <button
                  type='button'
                  onClick={() => setIsSortOpen((v) => !v)}
                  className='flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-2 border-primary/14 bg-white px-3 text-xs font-semibold text-foreground shadow-sm hover:border-primary/22'
                >
                  <ArrowUpDown className='h-4 w-4 text-primary/55' strokeWidth={2.5} />
                  <span>
                    {t('sortTrigger', {
                      label: t(`sort.${sortBy}` as Parameters<typeof t>[0]),
                    })}
                  </span>
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 text-primary/50 transition-transform', isSortOpen && 'rotate-180')}
                    strokeWidth={2.5}
                  />
                </button>
                {isSortOpen ? (
                  <div className='absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-primary/20 bg-white p-2 shadow-lg'>
                    {sortOptions.map((s) => (
                      <button
                        key={s}
                        type='button'
                        onClick={() => {
                          setSortBy(s);
                          setPage(0);
                          setIsSortOpen(false);
                        }}
                        className={cn(
                          'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                          sortBy === s ? 'bg-primary/5 font-medium text-primary' : 'hover:bg-primary/5'
                        )}
                      >
                        {t(`sort.${s}` as Parameters<typeof t>[0])}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <Link
                href='/dashboard/property/create'
                className='ml-auto inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-4'
              >
                <Plus className='h-3.5 w-3.5 shrink-0' strokeWidth={2.5} />
                <span>{t('createNew')}</span>
              </Link>
            </div>
          </div>
      </div>

      <ThreeDPromoBanner />

      <div className='flex min-h-0 flex-1 flex-col overflow-y-auto'>
          <div className='grid gap-3 px-4 pt-3 pb-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 sm:px-6'>
            {isAgentUser ? (
              <>
                <div className='rounded-2xl border border-primary/12 bg-white p-4 shadow-sm'>
                  <p className='text-xs font-semibold text-muted-foreground'>
                    {t('kpi.agent.currentProperties')}
                  </p>
                  <p className='mt-1 text-2xl font-bold tabular-nums text-foreground'>
                    {formatNumber(totalPropsMetric || totalElements)}
                  </p>
                </div>
                <div className='rounded-2xl border border-primary/12 bg-white p-4 shadow-sm'>
                  <p className='text-xs font-semibold text-muted-foreground'>
                    {t('kpi.agent.activeProperties')}
                  </p>
                  <p className='mt-1 text-2xl font-bold tabular-nums text-foreground'>
                    {formatNumber(activePropMetric)}
                  </p>
                </div>
                <div className='rounded-2xl border border-primary/12 bg-white p-4 shadow-sm'>
                  <p className='text-xs font-semibold text-muted-foreground'>
                    {t('kpi.agent.runningListings')}
                  </p>
                  <p className='mt-1 text-2xl font-bold tabular-nums text-foreground'>
                    {formatNumber(publishedListingsMetric)}
                  </p>
                  <p className='mt-1 text-xs font-medium text-amber-600'>
                    {t('kpi.expiringHint', { count: formatNumber(expiringSoonMetric) })}
                  </p>
                </div>
                <div className='rounded-2xl border border-primary/12 bg-white p-4 shadow-sm'>
                  <p className='text-xs font-semibold text-muted-foreground'>
                    {t('kpi.agent.soldOrRented')}
                  </p>
                  <p className='mt-1 text-2xl font-bold tabular-nums text-foreground'>
                    {formatNumber(soldPropMetric + rentedPropMetric)}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {t('kpi.agent.soldRentedBreakdown', {
                      sold: formatNumber(soldPropMetric),
                      rented: formatNumber(rentedPropMetric),
                    })}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className='rounded-2xl border border-primary/12 bg-white p-4 shadow-sm'>
                  <p className='text-xs font-semibold text-muted-foreground'>{t('kpi.totalAssets')}</p>
                  <p className='mt-1 text-2xl font-bold tabular-nums text-foreground'>
                    {formatNumber(totalPropsMetric || totalElements)}
                  </p>
                  <p className='mt-1 text-xs font-medium text-emerald-600'>
                    {t('kpi.activeAssetsHint', { count: formatNumber(activePropMetric) })}
                  </p>
                </div>
                <div className='rounded-2xl border border-primary/12 bg-white p-4 shadow-sm'>
                  <p className='text-xs font-semibold text-muted-foreground'>{t('kpi.totalArea')}</p>
                  <p className='mt-1 text-2xl font-bold tabular-nums text-foreground'>
                    {formatNumber(Math.round(totalLandMetric))} m²
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {t('kpi.avgAreaHint', { value: formatNumber(Math.round(avgLandMetric)) })}
                  </p>
                </div>
                <div className='rounded-2xl border border-primary/12 bg-white p-4 shadow-sm'>
                  <p className='text-xs font-semibold text-muted-foreground'>{t('kpi.estimatedValue')}</p>
                  <p className='mt-1 text-2xl font-bold tabular-nums text-foreground'>
                    {portfolioMetric > 0 ? formatVND(portfolioMetric) : '—'}
                  </p>
                  {yoyPercent != null ? (
                    <p className='mt-1 text-xs font-medium text-primary'>
                      ↑ {yoyPercent >= 0 ? '+' : ''}
                      {yoyPercent.toFixed(1)}% {t('kpi.yoyHint')}
                    </p>
                  ) : (
                    <p className='mt-1 text-xs text-muted-foreground'>{t('kpi.valueFootnote')}</p>
                  )}
                </div>
                <div className='rounded-2xl border border-primary/12 bg-white p-4 shadow-sm'>
                  <p className='text-xs font-semibold text-muted-foreground'>{t('kpi.runningListings')}</p>
                  <p className='mt-1 text-2xl font-bold tabular-nums text-foreground'>
                    {formatNumber(publishedListingsMetric)}
                  </p>
                  <p className='mt-1 text-xs font-medium text-amber-600'>
                    {t('kpi.expiringHint', { count: formatNumber(expiringSoonMetric) })}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className='mt-5 mb-2 flex items-center justify-between px-4 sm:px-6'>
            <h2 className='text-base font-bold text-foreground'>{t('gridSectionTitle')}</h2>
            <button
              type='button'
              onClick={resetFilters}
              className='text-xs font-semibold text-primary hover:underline'
            >
              {t('filterPanelReset')}
            </button>
          </div>

          <div className='flex-1 px-4 pb-8 sm:px-6'>
            {isLoading ? (
              <div className='flex min-h-[240px] items-center justify-center'>
                <Spinner className='size-8 text-primary' />
              </div>
            ) : (
              <>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                  {properties.map((property) => (
                    <PropertyPortfolioGridCard
                      key={property.property_id}
                      property={property}
                    />
                  ))}
                </div>
                {properties.length === 0 ? (
                  <div className='mt-8 flex flex-col items-center gap-2 text-center'>
                    <Home className='h-10 w-10 text-primary/30' />
                    <p className='text-sm font-semibold text-foreground'>{t('noProperties')}</p>
                    <p className='text-xs text-muted-foreground'>{t('noPropertiesDesc')}</p>
                  </div>
                ) : null}
                {totalPages > 1 ? (
                  <div className='mt-8 flex justify-center'>
                    <RealVistaPagination
                      currentPage={page + 1}
                      totalPages={totalPages}
                      onPageChange={(p) => setPage(p - 1)}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
      </div>
    </div>
  );
}
