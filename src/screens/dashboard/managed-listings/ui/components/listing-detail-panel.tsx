'use client';

import { useChatWindowStore } from '@/entities/contact';
import { conversationQueries } from '@/entities/conversation';
import type { Listing } from '@/entities/listing';
import { mapListingToProperty } from '@/entities/listing/lib/listing-to-property.mapper';
import type { Property } from '@/entities/property';
import { isAuthenticated, useAuthSession } from '@/features/auth/model';
import { EditListingModal } from '@/features/edit-listing-modal';
import { ListingMetricsCard, ListingWeeklyViewsChart } from '@/features/listing-analytics';
import { ListingStatusActions } from '@/features/listing-status';
import { RentalFeatures } from '@/features/rental-features';
import { useDeleteListing } from '@/features/edit-listing-modal/api/use-delete-listing';
import { handleErrorApi } from '@/shared/lib/utils/handle-error';
import { ListingLifetimeCard } from './listing-lifetime-card';
import { ListingBoostSection } from './listing-boost-section';
import { ListingAppointmentsCalendar } from './listing-appointments-calendar';
import { usePublishedLifetimeLabel } from '../../lib/use-published-lifetime-label';
import { Link } from '@/shared/config/i18n/navigation';
import { ROUTES } from '@/shared/config/routes';
import { useIsMobile } from '@/shared/lib/hooks/use-mobile';
import { AttributeIcon } from '@/shared/ui/attribute-icon';
import { ListingDescription } from '@/shared/ui/listing-description';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { GoogleMap, AdvancedMarker, Pin } from '@/shared/ui/map/google-map';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import { formatNumber } from '@/shared/lib/utils/format-currency';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Eye,
  Mail,
  Phone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  CalendarDays,
  Calendar,
  Home,
  BedDouble,
  Ruler,
  Users,
  FileText,
  Tag,
  LayoutGrid,
  Sparkles,
  MapPin,
  Maximize2,
  Cuboid,
  Receipt,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ListingDetailPanelProps {
  listing: Listing;
  onBack?: () => void;
}

function toMoney(n: unknown): number | null {
  if (n === null || n === undefined) return null;
  if (typeof n === 'number' && Number.isFinite(n)) return n;
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
}

function formatVndFull(amount: number, localeTag: 'vi-VN' | 'en-US'): string {
  return `${amount.toLocaleString(localeTag)} VNĐ`;
}

function formatMoneyBandLine(
  min: number | null,
  max: number | null,
  localeTag: 'vi-VN' | 'en-US',
  fromLabel: (formatted: string) => string,
  upToLabel: (formatted: string) => string,
): string | null {
  if (min != null && max != null) {
    return `${formatVndFull(min, localeTag)} – ${formatVndFull(max, localeTag)}`;
  }
  if (min != null) return fromLabel(formatVndFull(min, localeTag));
  if (max != null) return upToLabel(formatVndFull(max, localeTag));
  return null;
}

export function ListingDetailPanel({ listing, onBack }: ListingDetailPanelProps) {
  const t = useTranslations('ListingDetailPanel');
  const tGlobal = useTranslations();
  const intlLocale = useLocale();
  const localeTag: 'vi-VN' | 'en-US' = intlLocale === 'vi' ? 'vi-VN' : 'en-US';
  const property: Property = mapListingToProperty(listing);

  const slides = React.useMemo(
    () => (property.images ?? []).filter((img) => Boolean(img.url)),
    [property.images]
  );
  const [imgIndex, setImgIndex] = React.useState(0);

  React.useEffect(() => {
    setImgIndex(0);
  }, [listing.listing_id]);

  const currentSlide = slides[imgIndex];

  const { data: session } = useAuthSession();
  const router = useRouter();
  const params = useParams();
  const { openWindow } = useChatWindowStore();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const actionsRef = React.useRef<HTMLDivElement>(null);

  // Close actions dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setIsActionsOpen(false);
      }
    }
    if (isActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActionsOpen]);

  const deleteMutation = useDeleteListing();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(listing.listing_id);
      setIsDeleteDialogOpen(false);
      if (onBack) onBack();
    } catch (error) {
      handleErrorApi({ error, t: tGlobal });
    }
  };

  const handleContact = async () => {
    if (!isAuthenticated(session)) {
      const locale = params?.locale || 'vi';
      router.push(`/${locale}/login`);
      return;
    }

    try {
      // Use the new create or get conversation API
      const response = await queryClient.fetchQuery(
        conversationQueries.detailOrCreate(listing.agent!.user_id)
      );

      const convData = (
        response && typeof response === 'object' && 'data' in response
          ? (response as Record<string, unknown>).data
          : response
      ) as Record<string, unknown>;

      const payload = convData?.payload as Record<string, unknown> | undefined;
      const payloadData = payload?.data as Record<string, unknown> | undefined;

      const conversationId = (payloadData?.conversation_id ?? convData?.conversation_id) as string;

      if (conversationId) {
        if (isMobile) {
          const locale = params?.locale || 'vi';
          router.push(`/${locale}${ROUTES.dashboard.messages}/${conversationId}`);
        } else {
          openWindow(conversationId, {
            id: listing.agent!.user_id,
            name: listing.agent!.full_name,
            avatar: listing.agent!.avatar_url,
          });
        }
      }
    } catch (error) {
      handleErrorApi({ error, t: tGlobal });
    }
  };

  // Get dynamic attributes from listing
  const attributes = listing.attributes ?? [];

  // Check if listing is created by someone other than the property owner
  const showAgentInfo = listing.is_created_by_owner === false && listing.agent;

  // Calculate availability status
  const availabilityDate = listing.available_from ? parseISO(listing.available_from) : null;
  const isAvailableNow = !availabilityDate || isPast(availabilityDate) || isToday(availabilityDate);
  const displayAvailableFrom = isAvailableNow
    ? t('features.availableImmediately')
    : availabilityDate
      ? format(availabilityDate, 'PP', { locale: vi })
      : t('features.availableImmediately');

  const { label: publishedLifetimeChipLabel, hoursLeft: publishedLifetimeHoursLeft } =
    usePublishedLifetimeLabel(listing.status, listing.published_at);

  const threeDRoomLabels = React.useMemo(() => {
    const count = Math.max(
      listing.total_3d_tours ?? 0,
      (listing.three_d_room_names ?? []).length
    );
    if (count === 0) return [];
    const raw = listing.three_d_room_names ?? [];
    return Array.from({ length: count }, (_, i) => {
      const name = typeof raw[i] === 'string' ? raw[i].trim() : '';
      return name || t('propertyInfo.unnamed3dRoom', { index: String(i + 1) });
    });
  }, [listing.total_3d_tours, listing.three_d_room_names, t]);

  const propertyExpectedPriceLine = React.useMemo(() => {
    const pr = listing.property?.price_range;
    if (!pr) return null;
    const slice = listing.listing_type === 'RENT' ? pr.rent : pr.buy;
    if (!slice) return null;
    const min = toMoney(slice.min);
    const max = toMoney(slice.max);
    return formatMoneyBandLine(
      min,
      max,
      localeTag,
      (amt) => t('propertyInfo.priceFrom', { amount: amt }),
      (amt) => t('propertyInfo.priceUpTo', { amount: amt })
    );
  }, [listing.property?.price_range, listing.listing_type, localeTag, t]);

  const listingNegotiationLine = React.useMemo(() => {
    const min = listing.min_price != null ? toMoney(listing.min_price) : null;
    const max = listing.max_price != null ? toMoney(listing.max_price) : null;
    return formatMoneyBandLine(
      min,
      max,
      localeTag,
      (amt) => t('propertyInfo.priceFrom', { amount: amt }),
      (amt) => t('propertyInfo.priceUpTo', { amount: amt })
    );
  }, [listing.min_price, listing.max_price, localeTag, t]);

  const manage3dHref = `${ROUTES.dashboard.property}/${listing.property_id}/3d`;

  return (
    <div className='min-h-full bg-white pb-20 sm:pb-8'>
      {/* Hero media — same pattern as manage property: full-width strip, prev/next */}
      <div className='relative h-64 w-full overflow-hidden bg-muted'>
        {/* Mobile: back + preview overlaid on hero (no extra header row) */}
        {onBack && (
          <div className='pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-2 px-3 pt-3 sm:hidden'>
            <button
              type='button'
              onClick={onBack}
              className='pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
            >
              <ArrowLeft className='h-5 w-5 shrink-0' strokeWidth={2.5} />
              <span>{t('backToList')}</span>
            </button>

            <Link
              href={`/listing/${listing.slug}`}
              className='pointer-events-auto flex items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-xs font-bold text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/55'
            >
              <Eye className='h-3.5 w-3.5 shrink-0' strokeWidth={2.5} />
              <span>{t('preview')}</span>
            </Link>
          </div>
        )}
        {currentSlide ? (
          currentSlide.type === 'video' ? (
            <video
              src={currentSlide.url}
              poster={currentSlide.thumbnailUrl || undefined}
              controls
              playsInline
              preload='metadata'
              className='h-full w-full object-cover'
            />
          ) : (
            <Image
              src={currentSlide.type === '3d-tour' ? (currentSlide.thumbnailUrl || currentSlide.url) : currentSlide.url}
              alt={currentSlide.alt || property.title}
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, 70vw'
              priority={imgIndex === 0}
            />
          )
        ) : (
          <div className='flex h-full w-full items-center justify-center'>
            <Home className='h-16 w-16 text-muted-foreground/30' strokeWidth={1.5} />
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button
              type='button'
              onClick={() => setImgIndex((i) => (i > 0 ? i - 1 : slides.length - 1))}
              className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80'
              aria-label={t('hero.prevImage')}
            >
              <ChevronLeft className='h-4 w-4' strokeWidth={2} />
            </button>
            <button
              type='button'
              onClick={() => setImgIndex((i) => (i < slides.length - 1 ? i + 1 : 0))}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80'
              aria-label={t('hero.nextImage')}
            >
              <ChevronRight className='h-4 w-4' strokeWidth={2} />
            </button>
            <div className='absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white'>
              {imgIndex + 1} / {slides.length}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className='flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6'>
        {/* Header with Title, Status Actions, and Calendar Button */}
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
            <div className='flex flex-col gap-2'>
              <h1 className='text-xl sm:text-2xl font-bold leading-tight tracking-tight text-foreground'>
                {property.title}
              </h1>
              <p className='text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground'>
                {property.address || t('addressNotAvailable')}
              </p>
            </div>

            <div className='flex flex-col items-center gap-2 sm:shrink-0 sm:items-end relative'>
              <div className='relative w-full sm:w-auto' ref={actionsRef}>
                <button
                  type='button'
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className='flex w-full cursor-pointer whitespace-nowrap sm:w-auto items-center justify-center gap-2 rounded-lg border border-primary/20 bg-white px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                  aria-label={t('actions')}
                  aria-expanded={isActionsOpen}
                >
                  <span>{t('actions')}</span>
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', isActionsOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                </button>

                {isActionsOpen && (
                  <div className='absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-primary/20 bg-white shadow-lg p-2 flex flex-col gap-1'>
                    <button
                      type='button'
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsEditModalOpen(true);
                      }}
                      className='flex cursor-pointer items-center gap-2 w-full text-left px-3 py-2 text-xs text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
                    >
                      <Pencil className='h-4 w-4' strokeWidth={2} />
                      <span>{t('editListing')}</span>
                    </button>
                    <Link
                      href={`/listing/${listing.slug}`}
                      onClick={() => setIsActionsOpen(false)}
                      className='flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium'
                    >
                      <Eye className='h-4 w-4' strokeWidth={2} />
                      <span>{t('preview')}</span>
                    </Link>
                    <Link
                      href={`${ROUTES.dashboard.appointments}?listing=${listing.listing_id}`}
                      onClick={() => setIsActionsOpen(false)}
                      className='flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium'
                    >
                      <CalendarDays className='h-4 w-4' strokeWidth={2} />
                      <span>{t('viewAppointments')}</span>
                    </Link>
                    <div className='my-1 h-px bg-border' />
                    <button
                      type='button'
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                      className='flex cursor-pointer items-center gap-2 w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1'
                    >
                      <Trash2 className='h-4 w-4' strokeWidth={2} />
                      <span>{t('deleteListing', { fallback: 'Delete Listing' })}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Update Actions */}
          <ListingStatusActions
            listingId={listing.listing_id}
            status={listing.status}
            listingType={listing.listing_type}
            propertyAddress={property.address}
            listingTitle={listing.name}
            publishedLifetimeChipLabel={publishedLifetimeChipLabel}
            publishedLifetimeHoursLeft={publishedLifetimeHoursLeft}
          />
        </div>

        <Tabs key={listing.listing_id} defaultValue='performance' className='w-full'>
          <TabsList
            variant='line'
            className='mb-4 h-auto min-h-9 w-full flex-wrap justify-start gap-x-1 gap-y-1 border-b border-primary/15 pb-px sm:flex-nowrap'
          >
            <TabsTrigger value='performance' className='shrink-0 px-2 text-xs sm:px-3 sm:text-sm'>
              {t('detailTabs.performance')}
            </TabsTrigger>
            <TabsTrigger value='description' className='shrink-0 px-2 text-xs sm:px-3 sm:text-sm'>
              {t('detailTabs.description')}
            </TabsTrigger>
            <TabsTrigger value='property' className='shrink-0 px-2 text-xs sm:px-3 sm:text-sm'>
              {t('detailTabs.property')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='performance' className='mt-0 flex flex-col gap-6 focus-visible:outline-none'>
            {listing.status === 'PUBLISHED' && listing.published_at ? (
              <ListingBoostSection listing={listing} />
            ) : null}
            <div className='grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2'>
              <ListingWeeklyViewsChart listingId={listing.listing_id} />
              <ListingMetricsCard listingId={listing.listing_id} />
            </div>
            {listing.status === 'PUBLISHED' && listing.published_at ? (
              <ListingLifetimeCard listing={listing} />
            ) : null}
            <div className='border-t border-primary/10' />
            <ListingAppointmentsCalendar listingId={listing.listing_id} />
          </TabsContent>

          <TabsContent value='description' className='mt-0 focus-visible:outline-none'>
            {listing.content || property.description ? (
              <ListingDescription
                content={listing.content || property.description || ''}
                size='sm'
              />
            ) : (
              <p className='text-sm text-muted-foreground'>{t('propertyInfo.emptyDescription')}</p>
            )}
          </TabsContent>

          <TabsContent value='property' className='mt-0 flex flex-col gap-6 focus-visible:outline-none'>
            {/* Price */}
            <div>
              <div className='mb-3 flex items-center gap-2'>
                <Tag className='h-4 w-4 text-primary' strokeWidth={2} />
                <h3 className='text-base font-bold text-foreground'>
                  {listing.listing_type === 'SALE'
                    ? t('propertyInfo.priceSale')
                    : t('propertyInfo.priceRent')}
                </h3>
              </div>
              <div className='flex flex-col gap-4'>
                {/* Listed price — full number + VNĐ */}
                <div className='flex flex-col gap-0.5'>
                  <p className='text-xs font-medium text-muted-foreground'>{t('propertyInfo.listedPrice')}</p>
                  <p className='text-xl font-bold tracking-tight text-foreground'>
                    {formatVndFull(Number(listing.price), localeTag)}
                  </p>
                  {listing.is_negotiable && (
                    <span className='mt-1 inline-flex w-fit rounded-md bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary'>
                      {t('propertyInfo.negotiable')}
                    </span>
                  )}
                </div>

                {/* Expected price from property (owner input at property creation) */}
                {propertyExpectedPriceLine && (
                  <div className='flex flex-col gap-0.5'>
                    <p className='text-xs font-medium text-muted-foreground'>
                      {t('propertyInfo.propertyOwnerExpectedPrice')}
                    </p>
                    <p className='text-base font-semibold text-foreground'>{propertyExpectedPriceLine}</p>
                  </div>
                )}

                {/* Negotiation range on listing */}
                {listingNegotiationLine && (
                  <div className='flex flex-col gap-0.5'>
                    <p className='text-xs font-medium text-muted-foreground'>
                      {t('propertyInfo.listingNegotiationRange')}
                    </p>
                    <p className='text-base font-semibold text-foreground'>{listingNegotiationLine}</p>
                  </div>
                )}

                {/* Security deposit for rentals */}
                {listing.listing_type === 'RENT' &&
                listing.security_deposit != null &&
                listing.security_deposit > 0 && (
                  <div className='flex flex-col gap-0.5'>
                    <p className='text-xs font-medium text-muted-foreground'>{t('propertyInfo.deposit')}</p>
                    <p className='text-base font-semibold text-foreground'>
                      {formatVndFull(Number(listing.security_deposit), localeTag)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {listing.cost_breakdown && listing.listing_type === 'RENT' ? (
              <>
                <div className='border-t border-primary/10' />
                <div>
                  <div className='mb-3 flex items-center gap-2'>
                    <Receipt className='h-4 w-4 text-primary' strokeWidth={2} />
                    <h3 className='text-base font-bold text-foreground'>{t('propertyInfo.serviceFeesTitle')}</h3>
                  </div>
                  <div className='flex flex-col gap-3 text-sm'>
                    <div className='flex flex-col gap-1 rounded-xl bg-primary/[0.04] px-4 py-3'>
                      <span className='text-xs font-medium text-muted-foreground'>
                        {t('propertyInfo.baseRentLabel')} ({listing.cost_breakdown.base_price_unit})
                      </span>
                      <span className='text-base font-bold text-foreground'>
                        {formatVndFull(Number(listing.cost_breakdown.base_price), localeTag)}
                      </span>
                    </div>
                    {(listing.cost_breakdown.required_fees ?? []).length > 0 && (
                      <div className='space-y-2'>
                        <p className='text-xs font-semibold text-foreground'>{t('propertyInfo.requiredFeesLabel')}</p>
                        {(listing.cost_breakdown.required_fees ?? []).map((fee) => (
                          <div key={fee.name} className='flex items-center justify-between gap-2'>
                            <span className='text-muted-foreground'>{fee.name}</span>
                            <span className='shrink-0 font-medium text-foreground'>
                              {formatVndFull(Number(fee.amount), localeTag)}
                            </span>
                          </div>
                        ))}
                        <div className='flex items-center justify-between border-t border-primary/8 pt-2 text-xs font-medium text-muted-foreground'>
                          <span>{t('propertyInfo.requiredFeesSubtotal')}</span>
                          <span>{formatVndFull(Number(listing.cost_breakdown.required_fees_subtotal), localeTag)}</span>
                        </div>
                      </div>
                    )}
                    {(listing.cost_breakdown.optional_fees ?? []).length > 0 && (
                      <div className='space-y-2'>
                        <p className='text-xs font-semibold text-foreground'>{t('propertyInfo.optionalFeesLabel')}</p>
                        {(listing.cost_breakdown.optional_fees ?? []).map((fee) => (
                          <div key={fee.name} className='flex items-center justify-between gap-2'>
                            <span className='text-muted-foreground'>{fee.name}</span>
                            <span className='shrink-0 font-medium text-foreground'>
                              {formatVndFull(Number(fee.amount), localeTag)}
                            </span>
                          </div>
                        ))}
                        <div className='flex items-center justify-between text-xs font-medium text-muted-foreground'>
                          <span>{t('propertyInfo.optionalFeesSubtotal')}</span>
                          <span>{formatVndFull(Number(listing.cost_breakdown.optional_fees_subtotal), localeTag)}</span>
                        </div>
                      </div>
                    )}
                    <div className='flex items-center justify-between rounded-lg border border-primary/12 bg-primary/[0.06] px-3 py-2.5'>
                      <span className='text-sm font-bold text-foreground'>{t('propertyInfo.totalEstimatedLabel')}</span>
                      <span className='text-sm font-bold text-foreground'>
                        {formatVndFull(Number(listing.cost_breakdown.total_cost), localeTag)}
                      </span>
                    </div>
                    {listing.cost_breakdown.disclaimer ? (
                      <p className='text-xs italic text-muted-foreground'>{listing.cost_breakdown.disclaimer}</p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}

            <div className='border-t border-primary/10' />

            {/* 3D tour summary */}
            <div>
              <div className='mb-3 flex items-center gap-2'>
                <Cuboid className='h-4 w-4 text-primary' strokeWidth={2} />
                <h3 className='text-base font-bold text-foreground'>{t('propertyInfo.tour3dTitle')}</h3>
              </div>
              {threeDRoomLabels.length > 0 ? (
                <div className='space-y-2'>
                  <p className='text-xs font-medium text-muted-foreground'>{t('propertyInfo.tour3dRooms')}</p>
                  <ul className='list-inside list-disc space-y-1 text-sm text-foreground'>
                    {threeDRoomLabels.map((label, idx) => (
                      <li key={`${idx}-${label}`}>{label}</li>
                    ))}
                  </ul>
                  <Link
                    href={manage3dHref}
                    className='mt-2 inline-flex w-fit rounded-lg border border-primary/20 bg-white px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5'
                  >
                    {t('propertyInfo.add3dCta')}
                  </Link>
                </div>
              ) : (
                <div className='rounded-xl border border-dashed border-primary/20 bg-primary/[0.02] p-4'>
                  <p className='text-sm font-semibold text-foreground'>{t('propertyInfo.tour3dMissingTitle')}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>{t('propertyInfo.tour3dMissingDescription')}</p>
                  <Link
                    href={manage3dHref}
                    className='mt-3 inline-flex w-fit rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90'
                  >
                    {t('propertyInfo.add3dCta')}
                  </Link>
                </div>
              )}
            </div>

            <div className='border-t border-primary/10' />

            {/* Attributes / Specs */}
            <div>
              <div className='mb-3 flex items-center gap-2'>
                <LayoutGrid className='h-4 w-4 text-primary' strokeWidth={2} />
                <h3 className='text-base font-bold text-foreground'>{t('propertyInfo.featuresTitle')}</h3>
              </div>
              {attributes.length > 0 ? (
                <div className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 sm:gap-5'>
                  {listing.listing_type === 'RENT' && (
                    <FeatureStat
                      label={t('features.availableFrom')}
                      value={displayAvailableFrom}
                      icon={Calendar}
                    />
                  )}
                  {attributes.map((attribute) => (
                    <div key={attribute.attribute_id} className='flex flex-col gap-4'>
                      <p className='text-sm font-medium leading-[1.5] text-muted-foreground'>
                        {attribute.attribute_name}
                      </p>
                      <div className='flex items-center gap-2'>
                        <AttributeIcon
                          iconName={attribute.icon}
                          className='size-5 text-foreground/50'
                          strokeWidth={2}
                        />
                        <p className='text-base font-bold leading-snug tracking-[-0.09px] text-foreground'>
                          {attribute.display_value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 sm:gap-5'>
                  {listing.listing_type === 'RENT' && (
                    <FeatureStat
                      label={t('features.availableFrom')}
                      value={displayAvailableFrom}
                      icon={Calendar}
                    />
                  )}
                  <FeatureStat
                    label={t('features.properties')}
                    value={t('features.notAvailable')}
                    icon={Home}
                  />
                  <FeatureStat
                    label={t('features.rooms')}
                    value={t('features.notAvailable')}
                    icon={BedDouble}
                  />
                  <FeatureStat
                    label={t('features.livingSpace')}
                    value={`${formatNumber(listing.property?.usable_size_m2 || 0)} m²`}
                    icon={Ruler}
                  />
                  <FeatureStat
                    label={t('features.yearBuilt')}
                    value={t('features.notAvailable')}
                    icon={Calendar}
                  />
                  <FeatureStat label={t('features.tenants')} value={t('features.notAvailable')} icon={Users} />
                  <FeatureStat label={t('features.request')} value={t('features.notAvailable')} icon={FileText} />
                </div>
              )}
            </div>

            {/* Dimensions from property */}
            {(listing.property.land_size_m2 > 0 ||
              listing.property.usable_size_m2 > 0 ||
              listing.property.width_m > 0 ||
              listing.property.length_m > 0) && (
              <>
                <div className='border-t border-primary/10' />
                <div>
                  <div className='mb-3 flex items-center gap-2'>
                    <Maximize2 className='h-4 w-4 text-primary' strokeWidth={2} />
                    <h3 className='text-base font-bold text-foreground'>{t('propertyInfo.dimensionsTitle')}</h3>
                  </div>
                  <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                    {listing.property.land_size_m2 > 0 && (
                      <div className='flex flex-col gap-1 rounded-xl bg-primary/[0.04] px-4 py-3'>
                        <p className='text-xs font-medium text-muted-foreground'>{t('propertyInfo.landSize')}</p>
                        <p className='text-base font-bold text-foreground'>
                          {formatNumber(listing.property.land_size_m2)} m²
                        </p>
                      </div>
                    )}
                    {listing.property.usable_size_m2 > 0 && (
                      <div className='flex flex-col gap-1 rounded-xl bg-primary/[0.04] px-4 py-3'>
                        <p className='text-xs font-medium text-muted-foreground'>{t('propertyInfo.usableSize')}</p>
                        <p className='text-base font-bold text-foreground'>
                          {formatNumber(listing.property.usable_size_m2)} m²
                        </p>
                      </div>
                    )}
                    {listing.property.width_m > 0 && (
                      <div className='flex flex-col gap-1 rounded-xl bg-primary/[0.04] px-4 py-3'>
                        <p className='text-xs font-medium text-muted-foreground'>{t('propertyInfo.width')}</p>
                        <p className='text-base font-bold text-foreground'>
                          {formatNumber(listing.property.width_m)} m
                        </p>
                      </div>
                    )}
                    {listing.property.length_m > 0 && (
                      <div className='flex flex-col gap-1 rounded-xl bg-primary/[0.04] px-4 py-3'>
                        <p className='text-xs font-medium text-muted-foreground'>{t('propertyInfo.length')}</p>
                        <p className='text-base font-bold text-foreground'>
                          {formatNumber(listing.property.length_m)} m
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {property.amenities && property.amenities.length > 0 ? (
              <>
                <div className='border-t border-primary/10' />
                <div>
                  <div className='mb-3 flex items-center gap-2'>
                    <Sparkles className='h-4 w-4 text-primary' strokeWidth={2} />
                    <h3 className='text-base font-bold text-foreground'>{t('propertyInfo.amenitiesTitle')}</h3>
                  </div>
                  <RentalFeatures property={property} />
                </div>
              </>
            ) : null}

            {showAgentInfo && (
              <>
                <div className='border-t border-primary/10' />
                <div>
                  <div className='mb-3 flex items-center gap-2'>
                    <Building2 className='h-4 w-4 text-primary' strokeWidth={2} />
                    <div>
                      <h3 className='text-base font-bold text-foreground'>{t('agent.title')}</h3>
                      <p className='text-xs text-muted-foreground'>{t('agent.subtitle')}</p>
                    </div>
                  </div>

                  <div className='flex items-start gap-4 rounded-xl border border-primary/12 bg-primary/[0.03] p-4'>
                    <div className='relative shrink-0'>
                      {listing.agent!.avatar_url ? (
                        <Image
                          src={listing.agent!.avatar_url}
                          alt={listing.agent!.full_name}
                          width={56}
                          height={56}
                          className='h-14 w-14 rounded-full object-cover'
                        />
                      ) : (
                        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-primary'>
                          <span className='text-lg font-bold text-white'>
                            {listing.agent!.first_name?.[0]}
                            {listing.agent!.last_name?.[0]}
                          </span>
                        </div>
                      )}
                      {listing.agent!.is_verified && (
                        <div className='absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white'>
                          <BadgeCheck className='h-4 w-4 fill-blue-500 text-white' strokeWidth={2} />
                        </div>
                      )}
                    </div>

                    <div className='flex-1 space-y-3'>
                      <div>
                        <h4 className='text-base font-bold text-foreground'>
                          {listing.agent!.business_name || listing.agent!.full_name}
                        </h4>
                        {listing.agent!.business_name && listing.agent!.full_name && (
                          <p className='text-sm text-muted-foreground'>{listing.agent!.full_name}</p>
                        )}
                        {listing.agent!.is_verified && (
                          <div className='mt-1 flex items-center gap-1.5'>
                            <BadgeCheck className='h-3.5 w-3.5 text-blue-500' strokeWidth={2} />
                            <span className='text-xs font-medium text-blue-600'>
                              {t('agent.verified')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className='space-y-2 text-sm'>
                        {listing.agent!.phone && (
                          <div className='flex items-center gap-2 text-muted-foreground'>
                            <Phone className='h-4 w-4' strokeWidth={2} />
                            <span>{listing.agent!.phone}</span>
                          </div>
                        )}
                        {listing.agent!.email && (
                          <div className='flex items-center gap-2 text-muted-foreground'>
                            <Mail className='h-4 w-4' strokeWidth={2} />
                            <span>{listing.agent!.email}</span>
                          </div>
                        )}
                        {listing.agent!.company && (
                          <div className='flex items-center gap-2 text-muted-foreground'>
                            <Building2 className='h-4 w-4' strokeWidth={2} />
                            <span>{listing.agent!.company}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type='button'
                        onClick={handleContact}
                        className='mt-2 w-full cursor-pointer rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                      >
                        {t('agent.contact')}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className='border-t border-primary/10' />

            {/* Map */}
            <div>
              <div className='mb-3 flex items-center gap-2'>
                <MapPin className='h-4 w-4 text-primary' strokeWidth={2} />
                <h3 className='text-base font-bold text-foreground'>{t('propertyInfo.mapTitle')}</h3>
              </div>
              <div className='relative h-[240px] w-full overflow-hidden rounded-xl sm:h-[300px]'>
                <GoogleMap
                  defaultCenter={{
                    lat: listing.location.latitude,
                    lng: listing.location.longitude,
                  }}
                  defaultZoom={15}
                  mapId='managed-listing-detail-map'
                  className='h-full w-full'
                >
                  <AdvancedMarker
                    position={{
                      lat: listing.location.latitude,
                      lng: listing.location.longitude,
                    }}
                    title={property.address}
                  >
                    <Pin background='#7065F0' borderColor='#100A55' glyphColor='#FFFFFF' />
                  </AdvancedMarker>
                </GoogleMap>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <EditListingModal
        listing={listing}
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirmTitle', { fallback: 'Delete Listing' })}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirmDescription', {
                fallback:
                  'Are you sure you want to delete this listing? This action cannot be undone.',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2'>
            <button
              type='button'
              onClick={() => setIsDeleteDialogOpen(false)}
              className='flex h-11 cursor-pointer items-center justify-center rounded-lg border border-primary/20 bg-white px-6 text-sm font-bold text-foreground transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              disabled={deleteMutation.isPending}
            >
              {t('deleteConfirmCancel', { fallback: 'Cancel' })}
            </button>
            <button
              type='button'
              onClick={handleDelete}
              className='flex h-11 cursor-pointer items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-bold text-white transition-all hover:bg-red-700 shadow-[0px_4px_12px_0px_color-mix(in_oklch,var(--destructive)_20%,transparent)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t('deleting', { fallback: 'Deleting...' })
                : t('deleteConfirmApprove', { fallback: 'Delete' })}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className='flex flex-col gap-4'>
      <p className='text-sm font-medium leading-[1.5] text-muted-foreground'>{label}</p>
      <div className='flex items-center gap-2'>
        <Icon className='size-5 text-foreground/50' strokeWidth={2} />
        <p className='text-base font-bold leading-snug tracking-[-0.09px] text-foreground'>
          {value}
        </p>
      </div>
    </div>
  );
}
