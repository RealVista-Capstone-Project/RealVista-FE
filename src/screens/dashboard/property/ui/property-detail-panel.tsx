'use client';

import * as React from 'react';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Home,
  ShieldCheck,
  Box,
  MapPin,
  User,
  Trash2,
  AlertTriangle,
  UserCheck,
  Globe,
  EyeOff,
  Clock,
  CheckCircle2,
  Key,
  Eye,
  Building,
  Receipt,
  Phone,
  CalendarDays,
} from 'lucide-react';

import { Separator } from '@/shared/ui/separator';
import { Button } from '@/shared/ui/button';
import { Link } from '@/shared/config/i18n/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/shared/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '@/entities/property/api/property.api';
import { PROPERTY_DETAIL_QUERY_KEY } from '@/entities/property/api/use-property-detail';
import { listingQueries } from '@/entities/listing/api';
import { formatVND } from '@/shared/lib/utils/format-currency';
import { cn } from '@/shared/lib/utils';
import { AttributeIcon } from '@/shared/ui/attribute-icon';
import { useMyEngagementsQuery } from '@/features/engagement/hooks/use-my-engagements';
import { Spinner } from '@/shared/ui/spinner';
import type {
  PropertyBillingCycle,
  PropertySummaryResponse,
} from '@/entities/property/api/property-api.types';
import { usePropertyFees } from '@/entities/property/api/use-property-fees';


// Statuses controlled by the system — owner cannot manually set these
const SYSTEM_STATUSES = new Set(['PENDING', 'VERIFIED', 'REJECTED']);

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-background text-muted-foreground border-border',
  SOLD: 'bg-blue-50 text-blue-700 border-blue-200',
  RESERVED: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-rose-50 text-rose-700 border-rose-200',
  VERIFIED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  RENTED: 'bg-primary/5 text-primary border-primary/20',
};

function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] ?? 'bg-background text-muted-foreground border-border';
}

function soldByNameInitials(name: string): string {
  const s = name.trim();
  if (!s) return '?';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase();
}

function propertyFeeBillingLabel(cycle: PropertyBillingCycle, t: (key: string) => string): string {
  if (cycle === 'MONTHLY') return t('feeBillingMonthly');
  if (cycle === 'YEARLY') return t('feeBillingYearly');
  if (cycle === 'ONE_TIME') return t('feeBillingOneTime');
  return cycle;
}

function ListingsSection({
  propertyId,
  currentUserId,
}: {
  propertyId: string;
  currentUserId?: string;
}) {
  const t = useTranslations('PropertyDashboard');
  const PREVIEW_SIZE = 5;
  const { data: listingsPage, isLoading } = useQuery(
    listingQueries.byProperty(propertyId, PREVIEW_SIZE)
  );
  const listings = listingsPage?.content ?? [];
  const totalCount = listingsPage?.total_elements ?? listings.length;

  return (
    <div>
      {/* Section header */}
        <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <h3 className='text-base font-bold text-foreground'>{t('labelListings')}</h3>
          {totalCount > 0 && (
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 min-w-[1.375rem] h-6 px-1 text-xs font-bold text-primary'>
              {totalCount}
            </span>
          )}
        </div>
        <Button asChild size='sm' className='rounded-lg gap-1.5 h-9 text-sm'>
          <Link href={`/dashboard/listings/create?propertyId=${propertyId}`}>
            <Plus className='h-3.5 w-3.5' />
            {t('addListing')}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-6'>
          <Spinner className='size-5 text-primary' />
        </div>
      ) : listings.length === 0 ? (
        <div className='rounded-xl border border-dashed border-border bg-background py-8 flex flex-col items-center gap-2 text-center'>
          <Home className='h-6 w-6 text-muted-foreground/40' />
          <p className='text-sm text-muted-foreground'>{t('noListings')}</p>
        </div>
      ) : (
        <div className='space-y-2.5'>
          {listings.map((listing) => {
            const typeLabel =
              listing.listing_type === 'RENT' ? t('listingTypeRent') : t('listingTypeSale');
            const isRent = listing.listing_type === 'RENT';
            const statusConfig: Record<string, { cls: string; label: string }> = {
              DRAFT: {
                cls: 'bg-background text-muted-foreground border border-border',
                label: t('listingStatusDRAFT'),
              },
              PENDING: { cls: 'bg-amber-50 text-amber-600', label: t('listingStatusPENDING') },
              PUBLISHED: {
                cls: 'bg-emerald-50 text-emerald-700',
                label: t('listingStatusPUBLISHED'),
              },
              SOLD: { cls: 'bg-blue-50 text-blue-700', label: t('listingStatusSOLD') },
              RENTED: { cls: 'bg-primary/5 text-primary', label: t('listingStatusRENTED') },
              ARCHIVED: {
                cls: 'bg-background text-muted-foreground/70 border border-border',
                label: t('listingStatusARCHIVED'),
              },
            };
            const sc = statusConfig[listing.status] ?? {
              cls: 'bg-background text-muted-foreground border border-border',
              label: listing.status,
            };
            const priceDisplay = listing.is_negotiable
              ? t('negotiable')
              : listing.min_price && listing.max_price
                ? `${formatVND(listing.min_price)} – ${formatVND(listing.max_price)}`
                : formatVND(listing.price);

            return (
              <Link
                key={listing.listing_id}
                href={`/dashboard/listings?listingId=${listing.listing_id}`}
                className='flex gap-0 rounded-xl border border-border bg-background overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all group'
              >
                {/* Thumbnail — left column, fixed width */}
                <div className='relative w-24 flex-shrink-0 bg-muted'>
                  {(listing.primary_media_thumbnail_url ?? listing.thumbnail) ? (
                    <Image
                      src={(listing.primary_media_thumbnail_url ?? listing.thumbnail)!}
                      alt={listing.name}
                      fill
                      className='object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                  ) : (
                    <div className='h-full w-full flex items-center justify-center'>
                      <Home className='h-5 w-5 text-muted-foreground/30' />
                    </div>
                  )}
                </div>

                {/* Info — right column */}
                <div className='flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-between gap-1.5'>
                  {/* Name */}
                  <p className='text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors'>
                    {listing.name}
                  </p>

                  {/* Type + owner row */}
                  <div className='flex items-center justify-between gap-2'>
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-md',
                        isRent ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      )}
                    >
                      {typeLabel}
                    </span>
                    {listing.user_id && (
                      <span className='text-xs text-muted-foreground/60 font-medium truncate max-w-[90px]'>
                        {currentUserId && listing.user_id === currentUserId
                          ? t('selfPosted')
                          : t('agentPosted')}
                      </span>
                    )}
                  </div>

                  {/* Bottom row: status + price */}
                  <div className='flex items-center justify-between gap-2'>
                    <span
                      className={cn('text-xs font-semibold px-2 py-0.5 rounded-md', sc.cls)}
                    >
                      {sc.label}
                    </span>
                    <p className='text-sm font-bold text-primary whitespace-nowrap'>
                      {priceDisplay}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Show all button — only when there are more than preview size */}
          {totalCount > PREVIEW_SIZE && (
            <Link
              href={`/dashboard/listings?propertyId=${propertyId}`}
              className='flex items-center justify-center gap-1.5 w-full rounded-xl border border-primary/20 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors'
            >
              {t('showAllListings', { count: totalCount })}
              <ChevronRight className='h-3.5 w-3.5' />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const ENGAGEMENT_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  SUBMITTED: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  SUBMITTED_BY_OWNER: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  ACCEPTED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  REJECTED: { bg: 'bg-red-50 border-red-200', text: 'text-red-600' },
  CANCELLED: { bg: 'bg-background border-border', text: 'text-muted-foreground' },
  FINISHED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
};

function EngagementsSection({ propertyId }: { propertyId: string }) {
  const t = useTranslations('PropertyDashboard');
  const { data: allEngagements, isLoading } = useMyEngagementsQuery();

  const engagements = (allEngagements ?? []).filter((e) => e.propertyId === propertyId);

  return (
    <div>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <h3 className='text-base font-bold text-foreground'>{t('labelEngagements')}</h3>
          {engagements.length > 0 && (
            <span className='inline-flex items-center justify-center rounded-full bg-amber-100 min-w-[1.375rem] h-6 px-1 text-xs font-bold text-amber-700'>
              {engagements.length}
            </span>
          )}
        </div>
        <Button
          asChild
          size='sm'
          variant='default'
          className='rounded-lg h-9 text-sm'
        >
          <Link href={`/dashboard/property/${propertyId}/delegate`}>
            <UserCheck className='h-3.5 w-3.5' />
            {t('hireAgent')}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-6'>
          <Spinner className='size-5 text-primary' />
        </div>
      ) : engagements.length === 0 ? (
        <div className='rounded-xl border border-dashed border-border bg-background py-8 flex flex-col items-center gap-2 text-center'>
          <User className='h-6 w-6 text-muted-foreground/40' />
          <p className='text-sm text-muted-foreground'>{t('noEngagements')}</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {engagements.map((e) => {
            const isOwnerInvitation = e.engagementType === 'OWNER_INVITATION';
            const statusKey =
              e.status === 'SUBMITTED' && isOwnerInvitation ? 'SUBMITTED_BY_OWNER' : e.status;
            const statusStyle = ENGAGEMENT_STATUS_STYLES[statusKey] ?? {
              bg: 'bg-background border-border',
              text: 'text-muted-foreground',
            };
            const statusLabel = t(
              `engagementStatus${statusKey}` as Parameters<typeof t>[0],
              { defaultValue: e.status }
            );
            const commission = e.content?.commissionRate ?? e.content?.offeredCommission;
            const experience = e.content?.experienceYears;
            const canDelegate =
              !isOwnerInvitation && (e.status === 'SUBMITTED' || e.status === 'ACCEPTED');

            return (
              <div
                key={e.engagementId}
                className='rounded-xl border border-border bg-background overflow-hidden'
              >
                {/* Status bar */}
                <div
                  className={cn(
                    'px-4 py-1.5 flex items-center justify-between border-b',
                    statusStyle.bg
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-bold uppercase tracking-wide',
                      statusStyle.text
                    )}
                  >
                    {statusLabel}
                  </span>
                  <Link
                    href={`/dashboard/my-engagements?engagementId=${e.engagementId}`}
                    className={cn(
                      'flex items-center gap-1 text-xs font-semibold hover:underline',
                      statusStyle.text
                    )}
                  >
                    <Eye className='h-3.5 w-3.5' />
                    {t('viewAction')}
                  </Link>
                </div>

                {/* Card body */}
                <div className='p-4'>
                  <div className='flex items-start gap-3'>
                    {/* Avatar */}
                    <div className='h-11 w-11 rounded-full bg-muted overflow-hidden flex-shrink-0 ring-2 ring-background shadow-sm'>
                      {e.agentAvatarUrl ? (
                        <Image
                          src={e.agentAvatarUrl}
                          alt={e.agentFullName ?? ''}
                          width={44}
                          height={44}
                          className='object-cover w-full h-full'
                        />
                      ) : (
                        <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/5'>
                          <User className='h-5 w-5 text-primary/50' />
                        </div>
                      )}
                    </div>

                    {/* Agent info */}
                    <div className='flex-1 min-w-0'>
                      <p className='text-base font-bold text-foreground leading-snug'>
                        {e.agentFullName ?? e.initiatorName ?? '—'}
                      </p>
                      {e.content?.title && (
                        <p className='text-sm text-muted-foreground mt-0.5 line-clamp-1'>
                          {e.content.title}
                        </p>
                      )}
                    </div>

                    {/* Meta pills — right side */}
                    <div className='flex flex-col items-end gap-1.5 flex-shrink-0'>
                      {e.propertyTypeName && (
                        <span className='inline-flex items-center gap-1 text-xs font-medium bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-full'>
                          <Building className='h-3 w-3' />
                          {e.propertyTypeName}
                        </span>
                      )}
                      {commission != null && (
                        <span className='inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full'>
                          {t('commissionLabel')}: {commission}%
                        </span>
                      )}
                      {experience != null && (
                        <span className='inline-flex items-center gap-1 text-xs font-medium bg-primary/5 text-primary border border-primary/30 px-2.5 py-1 rounded-full'>
                          {experience} {t('yearsExperience')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delegate agent button */}
                  {canDelegate && (
                    <div className='mt-3 pt-3 border-t border-border/50'>
                      <Button
                        asChild
                        size='sm'
                        variant='outline'
                        className='w-full rounded-lg gap-2 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary'
                      >
                        <Link
                          href={`/dashboard/my-engagements?engagementId=${e.engagementId}&action=delegate`}
                        >
                          <UserCheck className='h-3.5 w-3.5' />
                          {t('delegateAgent')}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PropertyDetailPanel({
  property,
  onVerifyClick,
  onBack,
  onDeleted,
}: {
  property: PropertySummaryResponse;
  onVerifyClick: (p: PropertySummaryResponse) => void;
  onBack?: () => void;
  onDeleted?: () => void;
}) {
  const t = useTranslations('PropertyDashboard');
  const locale = useLocale();
  const { data: session } = useSession();
  const [imgIndex, setImgIndex] = useState(0);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = React.useRef<HTMLDivElement>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = React.useRef<HTMLDivElement>(null);

  // Owner-settable statuses (excludes system-controlled ones)
  const OWNER_STATUSES = ['DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED'] as const;
  type OwnerStatus = (typeof OWNER_STATUSES)[number];

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

  // Close status dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
    }
    if (isStatusOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStatusOpen]);

  const isOwner = !!(
    session?.user?.id &&
    property.owner_id &&
    session.user.id === property.owner_id
  );

  const backendRoles = session?.user?.backendRoles ?? [];
  const isAgentUser = session?.user?.role === 'AGENT' || backendRoles.includes('AGENT');

  const { data: propertyFees } = usePropertyFees(property.property_id);

  const { mutate: changeStatus, isPending: isStatusChanging } = useMutation({
    mutationFn: (status: string) =>
      propertyApi.updatePropertyStatus({ propertyId: property.property_id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'me'] });
      queryClient.invalidateQueries({ queryKey: [PROPERTY_DETAIL_QUERY_KEY, property.property_id] });
      setStatusConfirmOpen(false);
      setPendingStatus(null);
    },
    onError: () => {
      setStatusConfirmOpen(false);
      setPendingStatus(null);
    },
  });

  const { mutate: softDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => propertyApi.deleteProperty(property.property_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'me'] });
      queryClient.invalidateQueries({ queryKey: [PROPERTY_DETAIL_QUERY_KEY, property.property_id] });
      setDeleteConfirmOpen(false);
      onDeleted?.();
    },
  });

  const images = (property.media ?? []).filter((m) => m.media_type === 'IMAGE');

  React.useEffect(() => {
    setImgIndex(0);
  }, [property.property_id]);

  const location = [property.location_info?.district_name, property.location_info?.city_name]
    .filter(Boolean)
    .join(', ');

  const currentImageUrl = images[imgIndex]?.media_url;

  const showSoldByCard =
    property.status === 'SOLD' &&
    (property.sold_by_role === 'OWNER' || property.sold_by_role === 'AGENT');

  const soldByPersonName =
    property.sold_by_name?.trim() ||
    (property.sold_by_role === 'OWNER' ? t('soldByYouFallbackName') : '') ||
    '—';

  const soldByRoleLabel =
    property.sold_by_role === 'OWNER'
      ? t('soldByCardRoleOwner')
      : property.sold_by_role === 'AGENT'
        ? t('soldByCardRoleAgent')
        : '';

  const soldByPhone = property.sold_by_phone?.trim() || null;

  const soldAtFormatted =
    property.sold_at && !Number.isNaN(new Date(property.sold_at).getTime())
      ? new Date(property.sold_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

  return (
    <div className='min-h-full bg-white pb-20 sm:pb-8'>
      {/* Hero image / slider */}
      <div className='relative w-full h-64 bg-muted overflow-hidden'>
        {onBack && (
          <div className='pointer-events-none absolute left-0 right-0 top-0 z-20 px-4 pt-3 sm:px-6 sm:pt-4'>
            <button
              type='button'
              onClick={onBack}
              className='pointer-events-auto flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]'
            >
              <ChevronLeft className='h-4 w-4 shrink-0 [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.9))]' />
              {t('backToList')}
            </button>
          </div>
        )}
        {currentImageUrl ? (
          <Image
            src={currentImageUrl}
            alt={property.street_address}
            fill
            className='object-cover'
          />
        ) : (
          <div className='h-full w-full flex items-center justify-center'>
            <Home className='h-16 w-16 text-muted-foreground/30' />
          </div>
        )}

        {/* Prev / Next arrows — only when multiple images */}
        {images.length > 1 && (
          <>
            <button
              type='button'
              onClick={() => setImgIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
              className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-1.5 text-white transition-colors'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
            <button
              type='button'
              onClick={() => setImgIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-1.5 text-white transition-colors'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
            <div className='absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white'>
              {imgIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Header — title, location + Actions dropdown */}
      <div className='flex items-start justify-between gap-3 px-4 sm:px-6 pt-5 pb-2'>
        <div className='min-w-0 flex-1'>
          <h2 className='text-xl font-bold text-foreground'>{property.street_address}</h2>
          {location && (
            <div className='flex items-center gap-1.5 mt-1.5'>
              <MapPin className='h-4 w-4 text-muted-foreground/60' />
              <span className='text-sm text-muted-foreground'>{location}</span>
            </div>
          )}
        </div>

        {/* Actions dropdown */}
        <div className='relative shrink-0' ref={actionsRef}>
          <button
            type='button'
            onClick={() => setIsActionsOpen((v) => !v)}
            className='flex cursor-pointer items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
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
              {!isAgentUser && (
                <Link
                  href={`/dashboard/property/${property.property_id}/edit`}
                  onClick={() => setIsActionsOpen(false)}
                  className='flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium'
                >
                  <Edit className='h-4 w-4' strokeWidth={2} />
                  <span>{t('editAction')}</span>
                </Link>
              )}
              <Link
                href={`/dashboard/property/${property.property_id}/3d`}
                onClick={() => setIsActionsOpen(false)}
                className='flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium'
              >
                <Box className='h-4 w-4' strokeWidth={2} />
                <span>{t('3dAction')}</span>
              </Link>
              {property.status === 'PENDING' && (
                <button
                  type='button'
                  onClick={() => {
                    setIsActionsOpen(false);
                    onVerifyClick(property);
                  }}
                  className='flex cursor-pointer items-center gap-2 w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium'
                >
                  <ShieldCheck className='h-4 w-4' strokeWidth={2} />
                  <span>{t('verifyAction')}</span>
                </button>
              )}
              {isOwner && (
                <>
                  <div className='my-1 h-px bg-border' />
                  <button
                    type='button'
                    onClick={() => {
                      setIsActionsOpen(false);
                      setDeleteConfirmOpen(true);
                    }}
                    className='flex cursor-pointer items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium'
                  >
                    <Trash2 className='h-4 w-4' strokeWidth={2} />
                    <span>{t('deleteProperty')}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status — badge dropdown (interactive for owner) or static badge */}
      <div className='px-4 sm:px-6 pb-3'>
        {(() => {
          const isFinal = property.status === 'SOLD';
          const canChange = isOwner && !SYSTEM_STATUSES.has(property.status) && !isFinal;

          const STATUS_OPTIONS: { status: OwnerStatus; icon: React.ReactNode }[] = [
            { status: 'AVAILABLE', icon: <Globe className='h-3.5 w-3.5' strokeWidth={2} /> },
            { status: 'DRAFT', icon: <EyeOff className='h-3.5 w-3.5' strokeWidth={2} /> },
            { status: 'RESERVED', icon: <Clock className='h-3.5 w-3.5' strokeWidth={2} /> },
            { status: 'SOLD', icon: <CheckCircle2 className='h-3.5 w-3.5' strokeWidth={2} /> },
            { status: 'RENTED', icon: <Key className='h-3.5 w-3.5' strokeWidth={2} /> },
          ];

          const currentOpt = STATUS_OPTIONS.find((o) => o.status === property.status);

          if (!canChange) {
            // Static badge — final / system status
            return (
              <div className='inline-flex items-center gap-2'>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border',
                    getStatusStyle(property.status)
                  )}
                >
                  {currentOpt?.icon}
                  {t(`status${property.status}` as Parameters<typeof t>[0])}
                </span>
              </div>
            );
          }

          return (
            <div className='relative inline-block' ref={statusRef}>
              {/* Badge trigger */}
              <button
                type='button'
                disabled={isStatusChanging}
                onClick={() => setIsStatusOpen((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50',
                  getStatusStyle(property.status)
                )}
              >
                {currentOpt?.icon}
                {t(`status${property.status}` as Parameters<typeof t>[0])}
                <ChevronDown
                  className={cn('h-3 w-3 transition-transform', isStatusOpen && 'rotate-180')}
                  strokeWidth={2.5}
                />
              </button>

              {/* Dropdown */}
              {isStatusOpen && (
                <div className='absolute left-0 top-full z-30 mt-1.5 min-w-[160px] rounded-xl border border-primary/20 bg-white shadow-lg p-1.5 flex flex-col gap-0.5'>
                  {STATUS_OPTIONS.filter((o) => o.status !== property.status).map(
                    ({ status, icon }) => (
                      <button
                        key={status}
                        type='button'
                        onClick={() => {
                          setIsStatusOpen(false);
                          setPendingStatus(status);
                          setStatusConfirmOpen(true);
                        }}
                        className={cn(
                          'flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors hover:bg-primary/5',
                          getStatusStyle(status)
                        )}
                      >
                        {icon}
                        {t(`status${status}` as Parameters<typeof t>[0])}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {showSoldByCard ? (
        <div className='px-4 sm:px-6 pb-3'>
          <div className='flex gap-3 rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-white to-primary/[0.02] p-4 shadow-sm'>
            <div
              className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary'
              aria-hidden
            >
              {soldByNameInitials(soldByPersonName)}
            </div>
            <div className='min-w-0 flex-1 space-y-2'>
              <div>
                <p className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
                  {t('soldByCardTitle')}
                </p>
                <p className='mt-0.5 text-base font-bold leading-snug text-foreground'>{soldByPersonName}</p>
                {soldByRoleLabel ? (
                  <span className='mt-1 inline-flex rounded-full border border-primary/20 bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-primary'>
                    {soldByRoleLabel}
                  </span>
                ) : null}
              </div>
              {soldByPhone || soldAtFormatted ? (
                <div className='flex flex-col gap-1.5 text-xs text-muted-foreground'>
                  {soldByPhone ? (
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
                      <Phone className='h-3.5 w-3.5 shrink-0 text-primary/60' strokeWidth={2} />
                      <span className='font-medium text-foreground/90'>{soldByPhone}</span>
                      <span className='text-[11px] text-muted-foreground'>({t('soldByCardPhone')})</span>
                    </div>
                  ) : null}
                  {soldAtFormatted ? (
                    <div className='flex items-center gap-2'>
                      <CalendarDays className='h-3.5 w-3.5 shrink-0 text-primary/60' strokeWidth={2} />
                      <span>
                        {t('soldByCardRecordedAt')}: <span className='font-medium text-foreground/85'>{soldAtFormatted}</span>
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs defaultValue='information' className='flex flex-col'>
        <div className='border-b border-primary/20 px-4 sm:px-6'>
          <TabsList
            variant='line'
            className='w-full justify-start gap-0 rounded-none bg-transparent p-0 h-auto'
          >
            <TabsTrigger
              value='information'
              className='rounded-none border-0 px-4 py-3 text-sm font-medium data-active:border-b-2 data-active:border-primary data-active:text-primary after:hidden'
            >
              {t('tabInformation')}
            </TabsTrigger>
            <TabsTrigger
              value='listings'
              className='rounded-none border-0 px-4 py-3 text-sm font-medium data-active:border-b-2 data-active:border-primary data-active:text-primary after:hidden'
            >
              {t('tabListings')}
            </TabsTrigger>
            {!isAgentUser && (
              <TabsTrigger
                value='agents'
                className='rounded-none border-0 px-4 py-3 text-sm font-medium data-active:border-b-2 data-active:border-primary data-active:text-primary after:hidden'
              >
                {t('tabAgents')}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Tab: Information */}
        <TabsContent value='information' className='p-4 sm:p-6'>
          {(() => {
            const hasBuy =
              property.price_range?.buy?.min != null || property.price_range?.buy?.max != null;
            const hasRent =
              property.price_range?.rent?.min != null || property.price_range?.rent?.max != null;
            const buyLabel = hasBuy
              ? property.price_range!.buy!.min != null && property.price_range!.buy!.max != null
                ? `${formatVND(property.price_range!.buy!.min)} – ${formatVND(property.price_range!.buy!.max)} đ`
                : property.price_range!.buy!.min != null
                  ? `Từ ${formatVND(property.price_range!.buy!.min)} đ`
                  : `Đến ${formatVND(property.price_range!.buy!.max!)} đ`
              : null;
            const rentLabel = hasRent
              ? property.price_range!.rent!.min != null && property.price_range!.rent!.max != null
                ? `${formatVND(property.price_range!.rent!.min)} – ${formatVND(property.price_range!.rent!.max)} đ`
                : property.price_range!.rent!.min != null
                  ? `Từ ${formatVND(property.price_range!.rent!.min)} đ`
                  : `Đến ${formatVND(property.price_range!.rent!.max!)} đ`
              : null;

            const facts: { label: string; value: string; accent?: string }[] = [
              ...(property.property_type_info?.property_type_name
                ? [{ label: t('labelType'), value: property.property_type_info.property_type_name }]
                : []),
              ...(buyLabel ? [{ label: t('priceSale'), value: buyLabel, accent: 'text-blue-600' }] : []),
              ...(rentLabel
                ? [{ label: t('priceRent'), value: rentLabel, accent: 'text-emerald-600' }]
                : []),
              ...(property.land_size_m2 != null
                ? [{ label: t('labelSize'), value: `${property.land_size_m2} m²` }]
                : []),
              ...(property.usable_size_m2 != null
                ? [{ label: t('usableSize'), value: `${property.usable_size_m2} m²` }]
                : []),
              ...(property.width_m != null
                ? [{ label: t('frontage'), value: `${property.width_m} m` }]
                : []),
              ...(property.length_m != null
                ? [{ label: t('depth'), value: `${property.length_m} m` }]
                : []),
            ];

            const hasAttributes = property.attributes && property.attributes.length > 0;
            const visibleAmenities = (property.amenities ?? []).filter(
              (a) =>
                a.amenity_name != null && String(a.amenity_name).trim() !== ''
            );
            const hasAmenities = visibleAmenities.length > 0;
            const serviceFeesList = propertyFees ?? [];
            const hasServiceFees = serviceFeesList.length > 0;
            const hasRight = facts.length > 0;
            const showBottomRow = hasServiceFees || hasRight;
            const showSepAfterAttributes = hasAttributes && (hasAmenities || showBottomRow);
            const showSepAfterAmenities = hasAmenities && showBottomRow;

            return (
              <div className='flex flex-col gap-6'>
                {property.description ? (
                  <section className='flex flex-col gap-3'>
                    <h3 className='text-base font-semibold tracking-tight text-foreground'>
                      {t('labelDescription')}
                    </h3>
                    <p className='text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap'>
                      {property.description}
                    </p>
                  </section>
                ) : null}

                {hasAttributes ? (
                  <section className='flex flex-col gap-3'>
                    <h3 className='text-base font-semibold tracking-tight text-foreground'>
                      {t('labelAttributes')}
                    </h3>
                    <div className='rounded-lg border border-primary/20 bg-white p-4'>
                      <div className='grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4'>
                        {property.attributes!.map((attr) => {
                          const hasValue =
                            (attr.display_value != null &&
                              attr.display_value !== '' &&
                              attr.display_value !== 'undefined') ||
                            attr.value_number != null ||
                            attr.value_text != null ||
                            attr.value_boolean != null;
                          if (!hasValue) return null;
                          let displayValue: string =
                            attr.display_value != null &&
                            attr.display_value !== '' &&
                            attr.display_value !== 'undefined'
                              ? String(attr.display_value)
                              : attr.value_number != null
                                ? `${attr.value_number}${attr.unit ? ' ' + attr.unit : ''}`
                                : attr.value_text != null
                                  ? attr.value_text
                                  : attr.value_boolean != null
                                    ? attr.value_boolean
                                      ? t('attributeTrue')
                                      : t('attributeFalse')
                                    : '—';
                          {
                            const b = displayValue.trim().toLowerCase();
                            if (b === 'true') displayValue = t('attributeTrue');
                            else if (b === 'false') displayValue = t('attributeFalse');
                          }
                          return (
                            <div key={attr.attribute_id} className='flex flex-col gap-2'>
                              <p className='text-sm font-medium leading-snug text-muted-foreground'>
                                {attr.attribute_name}
                              </p>
                              <div className='flex items-center gap-2'>
                                <AttributeIcon
                                  iconName={attr.icon ?? attr.attribute_code}
                                  className='size-5 shrink-0 text-foreground/50'
                                  strokeWidth={2}
                                />
                                <p className='text-sm font-semibold text-foreground'>
                                  {displayValue}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                ) : null}

                {showSepAfterAttributes ? <Separator /> : null}

                {hasAmenities ? (
                  <section className='flex flex-col gap-3'>
                    <h3 className='text-base font-semibold tracking-tight text-foreground'>
                      {t('labelAmenities')}
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      {visibleAmenities.map((a) => (
                        <span
                          key={a.amenity_id}
                          className='rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary'
                        >
                          {a.amenity_name}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                {showSepAfterAmenities ? <Separator /> : null}

                {showBottomRow ? (
                  <div
                    className={cn(
                      'grid gap-5',
                      hasServiceFees && hasRight ? 'md:grid-cols-2' : 'grid-cols-1'
                    )}
                  >
                    {hasServiceFees ? (
                      <div className='rounded-xl border border-primary/20 bg-white p-4'>
                        <div className='mb-3 flex items-center gap-2'>
                          <Receipt className='h-4 w-4 shrink-0 text-primary' strokeWidth={2} />
                          <h3 className='text-base font-semibold tracking-tight text-foreground'>
                            {t('labelServiceFees')}
                          </h3>
                        </div>
                        <ul className='flex flex-col gap-3'>
                          {serviceFeesList.map((fee) => (
                            <li
                              key={fee.property_fee_service_id}
                              className='flex flex-col gap-0.5 border-b border-primary/10 pb-3 last:border-0 last:pb-0'
                            >
                              <div className='flex items-start justify-between gap-2'>
                                <span className='text-sm font-medium text-foreground'>
                                  {fee.fee_name}
                                </span>
                                <span className='shrink-0 text-sm font-semibold text-foreground'>
                                  {formatVND(fee.amount)} đ
                                </span>
                              </div>
                              <div className='flex flex-wrap items-center gap-2'>
                                <span className='text-sm text-muted-foreground'>
                                  {propertyFeeBillingLabel(fee.billing_cycle, t)}
                                </span>
                                {fee.is_optional ? (
                                  <span className='rounded-md bg-primary/5 px-2 py-0.5 text-sm font-medium text-primary'>
                                    {t('feeOptional')}
                                  </span>
                                ) : null}
                              </div>
                              {fee.description != null && fee.description.trim() !== '' ? (
                                <p className='text-sm text-muted-foreground'>{fee.description}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {hasRight ? (
                      <div className='rounded-xl border border-primary/20 bg-white'>
                        <div className='border-b border-primary/10 px-4 py-3'>
                          <h3 className='text-base font-semibold tracking-tight text-foreground'>
                            {t('labelTypeDetails')}
                          </h3>
                        </div>
                        <div className='divide-y divide-primary/10'>
                          {facts.map((f, i) => (
                            <div
                              key={i}
                              className='flex items-center justify-between gap-3 px-4 py-2.5'
                            >
                              <span className='shrink-0 text-sm font-medium text-muted-foreground'>
                                {f.label}
                              </span>
                              <span
                                className={cn(
                                  'text-right text-sm font-semibold',
                                  f.accent ?? 'text-foreground'
                                )}
                              >
                                {f.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })()}
        </TabsContent>

        {/* Tab: Listings */}
        <TabsContent value='listings' className='p-4 sm:p-6'>
          <ListingsSection
            propertyId={property.property_id}
            currentUserId={session?.user?.id ?? undefined}
          />
        </TabsContent>

        {/* Tab: Agents (owner-centric; hidden for users with AGENT role) */}
        {!isAgentUser && (
          <TabsContent value='agents' className='p-4 sm:p-6'>
            <EngagementsSection propertyId={property.property_id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Confirm: change status */}
      <Dialog
        open={statusConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setStatusConfirmOpen(false);
            setPendingStatus(null);
          }
        }}
      >
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-500' />
              {t('confirmStatusTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            {t('confirmStatusDesc', {
              status: pendingStatus ? t(`status${pendingStatus}` as Parameters<typeof t>[0]) : '',
            })}
          </p>
          <DialogFooter className='gap-2'>
            <DialogClose asChild>
              <Button variant='outline' size='sm' className='rounded-lg'>
                {t('cancelAction')}
              </Button>
            </DialogClose>
            <Button
              size='sm'
              className='rounded-lg bg-primary'
              disabled={isStatusChanging}
              onClick={() => {
                if (pendingStatus) changeStatus(pendingStatus);
              }}
            >
              {isStatusChanging ? (
                <span className='flex items-center gap-2'>
                  <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  {t('saving')}
                </span>
              ) : (
                t('confirmAction')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: soft delete */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <Trash2 className='h-5 w-5' />
              {t('confirmDeleteTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>{t('confirmDeleteDesc')}</p>
          <DialogFooter className='gap-2'>
            <DialogClose asChild>
              <Button variant='outline' size='sm' className='rounded-lg'>
                {t('cancelAction')}
              </Button>
            </DialogClose>
            <Button
              size='sm'
              variant='destructive'
              className='rounded-lg'
              disabled={isDeleting}
              onClick={() => softDelete()}
            >
              {isDeleting ? (
                <span className='flex items-center gap-2'>
                  <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  {t('deleting')}
                </span>
              ) : (
                t('deleteAction')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
