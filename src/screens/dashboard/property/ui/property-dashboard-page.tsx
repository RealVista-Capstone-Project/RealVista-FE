'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Home,
  ShieldCheck,
  Box,
  MapPin,
  Ruler,
  Building,
  Eye,
  User,
  Trash2,
  AlertTriangle,
  UserCheck,
  Globe,
  EyeOff,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

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
import { propertyQueries } from '@/entities/property/api/property.queries';
import { propertyApi } from '@/entities/property/api/property.api';
import { listingQueries } from '@/entities/listing/api';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { AgentVerificationModal } from '@/features/property-management/ui/components/agent-verification-modal';
import { ThreeDPromoBanner } from '@/widgets/billing';
import { formatVND, formatNumber } from '@/shared/lib/utils/format-currency';
import { useIsMobile } from '@/shared/lib/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';
import { AttributeIcon } from '@/shared/ui/attribute-icon';
import { useMyEngagementsQuery } from '@/features/engagement/hooks/use-my-engagements';
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

function PropertyListCard({
  property,
  isSelected,
  onClick,
}: {
  property: PropertySummaryResponse;
  isSelected: boolean;
  onClick: (p: PropertySummaryResponse) => void;
}) {
  const t = useTranslations('PropertyDashboard');
  const thumbnailUrl =
    property.media?.find((m: PropertyMediaItem) => m.is_primary)?.media_url ??
    property.media?.[0]?.media_url;

  const location = [property.location_info?.district_name, property.location_info?.city_name]
    .filter(Boolean)
    .join(', ');

  return (
    <button
      type='button'
      onClick={() => onClick(property)}
      className={cn(
        'w-full cursor-pointer border-b border-primary/20 p-4 sm:p-6 text-left transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        isSelected && 'bg-primary/5'
      )}
    >
      <div className='flex items-center gap-3 sm:gap-4'>
        {/* Compact thumbnail */}
        <div className='relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-primary/5'>
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={property.street_address}
              fill
              className='object-cover transition-transform duration-300'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
              <Home className='h-7 w-7 text-primary/40' strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          {/* Row 1: address + type badge */}
          <div className='flex items-center gap-2'>
            <h3 className='line-clamp-1 text-base sm:text-lg font-medium leading-snug tracking-[-0.09px] text-foreground'>
              {property.street_address}
            </h3>
            {property.property_type_info?.property_type_name && (
              <span className='shrink-0 text-[11px] font-semibold bg-primary/5 text-primary px-2.5 py-0.5 rounded-lg border border-primary/10'>
                {property.property_type_info.property_type_name}
              </span>
            )}
          </div>

          {/* Row 2: location */}
          {location && (
            <div className='flex items-center gap-1'>
              <MapPin className='h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0' />
              <span className='line-clamp-1 text-sm font-normal text-foreground/70'>
                {location}
              </span>
            </div>
          )}

          {/* Row 3: status + dimensions + 3D */}
          <div className='flex items-center gap-2 text-sm flex-wrap'>
            {/* Status badge inline */}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold border',
                getStatusStyle(property.status)
              )}
            >
              {t(`status${property.status}` as Parameters<typeof t>[0])}
            </span>
            {(property.land_size_m2 != null ||
              property.width_m != null ||
              property.length_m != null) && <span className='text-foreground/50'>•</span>}
            {property.land_size_m2 != null && (
              <div className='flex items-center gap-1 text-foreground/70'>
                <Ruler className='h-3.5 w-3.5' />
                <span className='font-medium'>{property.land_size_m2} m²</span>
              </div>
            )}
            {property.width_m != null && property.length_m != null ? (
              <div className='flex items-center gap-1 text-foreground/70'>
                <Ruler className='h-3.5 w-3.5' />
                <span className='font-medium'>
                  {property.width_m} × {property.length_m} m
                </span>
              </div>
            ) : property.width_m != null ? (
              <div className='flex items-center gap-1 text-foreground/70'>
                <Ruler className='h-3.5 w-3.5' />
                <span className='font-medium'>{property.width_m} m</span>
              </div>
            ) : property.length_m != null ? (
              <div className='flex items-center gap-1 text-foreground/70'>
                <Ruler className='h-3.5 w-3.5' />
                <span className='font-medium'>{property.length_m} m</span>
              </div>
            ) : null}
            {/* 3D indicator */}
            <div className='ml-auto relative inline-flex items-center'>
              {property.has_3d ? (
                <Link
                  href={`/dashboard/property/${property.property_id}/3d`}
                  onClick={(e) => e.stopPropagation()}
                  className='text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100 transition-colors'
                >
                  <Box className='h-3 w-3' />
                  3D
                </Link>
              ) : (
                <Link
                  href={`/dashboard/property/${property.property_id}/3d`}
                  onClick={(e) => e.stopPropagation()}
                  className='relative flex items-center justify-center'
                  title={t('threeDDotTooltip')}
                >
                  <Box className='h-4 w-4 text-muted-foreground/50 hover:text-amber-500 transition-colors' />
                  <span className='absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 pointer-events-none'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75' />
                    <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500' />
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
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
  const { data: listingsPage, isLoading } = useQuery(listingQueries.byProperty(propertyId, PREVIEW_SIZE));
  const listings = listingsPage?.content ?? [];
  const totalCount = listingsPage?.total_elements ?? listings.length;

  return (
    <div>
      {/* Section header */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-bold text-foreground'>{t('labelListings')}</h3>
          {totalCount > 0 && (
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 w-5 h-5 text-[11px] font-bold text-primary'>
              {totalCount}
            </span>
          )}
        </div>
        <Button asChild size='sm' className='rounded-lg gap-1.5 h-8 text-xs'>
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
          <p className='text-xs text-muted-foreground'>{t('noListings')}</p>
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
                  <p className='text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors'>
                    {listing.name}
                  </p>

                  {/* Type + owner row */}
                  <div className='flex items-center justify-between gap-2'>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                        isRent ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      )}
                    >
                      {typeLabel}
                    </span>
                    {listing.user_id && (
                      <span className='text-[10px] text-muted-foreground/60 font-medium truncate max-w-[80px]'>
                        {currentUserId && listing.user_id === currentUserId
                          ? t('selfPosted')
                          : t('agentPosted')}
                      </span>
                    )}
                  </div>

                  {/* Bottom row: status + price */}
                  <div className='flex items-center justify-between gap-2'>
                    <span
                      className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md', sc.cls)}
                    >
                      {sc.label}
                    </span>
                    <p className='text-xs font-bold text-primary whitespace-nowrap'>
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
              className='flex items-center justify-center gap-1.5 w-full rounded-xl border border-primary/20 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors'
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

const ENGAGEMENT_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  SUBMITTED: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Chờ duyệt' },
  SUBMITTED_BY_OWNER: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    label: 'Chờ môi giới duyệt',
  },
  ACCEPTED: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    label: 'Đã chấp nhận',
  },
  REJECTED: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', label: 'Từ chối' },
  CANCELLED: { bg: 'bg-background border-border', text: 'text-muted-foreground', label: 'Đã hủy' },
  FINISHED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Hoàn thành' },
};

function EngagementsSection({ propertyId }: { propertyId: string }) {
  const t = useTranslations('PropertyDashboard');
  const { data: allEngagements, isLoading } = useMyEngagementsQuery();

  const engagements = (allEngagements ?? []).filter((e) => e.propertyId === propertyId);

  return (
    <div>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-bold text-foreground'>{t('labelEngagements')}</h3>
          {engagements.length > 0 && (
            <span className='inline-flex items-center justify-center rounded-full bg-amber-100 w-5 h-5 text-[11px] font-bold text-amber-700'>
              {engagements.length}
            </span>
          )}
        </div>
        <Button
          asChild
          size='sm'
          variant='outline'
          className='rounded-lg gap-1.5 h-8 text-xs border-primary/20 text-primary hover:bg-primary/5'
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
          <p className='text-xs text-muted-foreground'>{t('noEngagements')}</p>
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
              label: e.status,
            };
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
                      'text-[11px] font-bold uppercase tracking-wide',
                      statusStyle.text
                    )}
                  >
                    {statusStyle.label}
                  </span>
                  <Link
                    href={`/dashboard/my-engagements?engagementId=${e.engagementId}`}
                    className={cn(
                      'flex items-center gap-1 text-[11px] font-semibold hover:underline',
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
                      <p className='text-sm font-bold text-foreground leading-snug'>
                        {e.agentFullName ?? e.initiatorName ?? '—'}
                      </p>
                      {e.content?.title && (
                        <p className='text-xs text-muted-foreground mt-0.5 line-clamp-1'>
                          {e.content.title}
                        </p>
                      )}
                    </div>

                    {/* Meta pills — right side */}
                    <div className='flex flex-col items-end gap-1.5 flex-shrink-0'>
                      {e.propertyTypeName && (
                        <span className='inline-flex items-center gap-1 text-[11px] font-medium bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-full'>
                          <Building className='h-3 w-3' />
                          {e.propertyTypeName}
                        </span>
                      )}
                      {commission != null && (
                        <span className='inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full'>
                          {t('commissionLabel')}: {commission}%
                        </span>
                      )}
                      {experience != null && (
                        <span className='inline-flex items-center gap-1 text-[11px] font-medium bg-primary/5 text-primary border border-primary/30 px-2.5 py-1 rounded-full'>
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

function PropertyDetailPanel({
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
  const OWNER_STATUSES = ['DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD'] as const;
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

  const { mutate: changeStatus, isPending: isStatusChanging } = useMutation({
    mutationFn: (status: string) =>
      propertyApi.updatePropertyStatus({ propertyId: property.property_id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'me'] });
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

  return (
    <div className='min-h-full bg-white pb-20 sm:pb-8'>
      {/* Mobile back button */}
      {onBack && (
        <button
          type='button'
          onClick={onBack}
          className='flex items-center gap-2 px-6 py-4 text-sm font-medium text-primary hover:underline'
        >
          <ChevronLeft className='h-4 w-4' />
          {t('backToList')}
        </button>
      )}

      {/* Hero image / slider */}
      <div className='relative w-full h-64 bg-muted overflow-hidden'>
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
              <Link
                href={`/dashboard/property/${property.property_id}/edit`}
                onClick={() => setIsActionsOpen(false)}
                className='flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium'
              >
                <Edit className='h-4 w-4' strokeWidth={2} />
                <span>{t('editAction')}</span>
              </Link>
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
          const isFinal = property.status === 'SOLD' || property.status === 'RENTED';
          const canChange = isOwner && !SYSTEM_STATUSES.has(property.status) && !isFinal;

          const STATUS_OPTIONS: { status: OwnerStatus; icon: React.ReactNode }[] = [
            { status: 'AVAILABLE', icon: <Globe className='h-3.5 w-3.5' strokeWidth={2} /> },
            { status: 'DRAFT',     icon: <EyeOff className='h-3.5 w-3.5' strokeWidth={2} /> },
            { status: 'RESERVED',  icon: <Clock className='h-3.5 w-3.5' strokeWidth={2} /> },
            { status: 'SOLD',      icon: <CheckCircle2 className='h-3.5 w-3.5' strokeWidth={2} /> },
          ];

          const currentOpt = STATUS_OPTIONS.find((o) => o.status === property.status);

          if (!canChange) {
            // Static badge — final / system status
            return (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border',
                  getStatusStyle(property.status)
                )}
              >
                {currentOpt?.icon}
                {t(`status${property.status}` as Parameters<typeof t>[0])}
              </span>
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
                  {STATUS_OPTIONS.filter((o) => o.status !== property.status).map(({ status, icon }) => (
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
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

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
            <TabsTrigger
              value='agents'
              className='rounded-none border-0 px-4 py-3 text-sm font-medium data-active:border-b-2 data-active:border-primary data-active:text-primary after:hidden'
            >
              {t('tabAgents')}
            </TabsTrigger>
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
              ...(buyLabel ? [{ label: 'Giá bán', value: buyLabel, accent: 'text-blue-600' }] : []),
              ...(rentLabel
                ? [{ label: 'Giá thuê', value: rentLabel, accent: 'text-emerald-600' }]
                : []),
              ...(property.land_size_m2 != null
                ? [{ label: t('labelSize'), value: `${property.land_size_m2} m²` }]
                : []),
              ...(property.usable_size_m2 != null
                ? [{ label: 'Diện tích sử dụng', value: `${property.usable_size_m2} m²` }]
                : []),
              ...(property.width_m != null
                ? [{ label: 'Mặt tiền', value: `${property.width_m} m` }]
                : []),
              ...(property.length_m != null
                ? [{ label: 'Chiều dài', value: `${property.length_m} m` }]
                : []),
            ];

            const hasAttributes = property.attributes && property.attributes.length > 0;
            const hasAmenities = property.amenities && property.amenities.length > 0;
            const hasLeft = !!property.description || hasAttributes || hasAmenities;
            const hasRight = facts.length > 0;

            return (
              <div className={cn('flex gap-5', hasLeft && hasRight ? 'flex-col sm:flex-row sm:items-start' : 'flex-col')}>
                {/* Left — description, attributes, amenities */}
                {hasLeft && (
                  <div className='flex flex-col gap-5 flex-1 min-w-0'>
                    {property.description && (
                      <div className='flex flex-col gap-2'>
                        <h2 className='text-base font-bold tracking-[-0.24px] text-foreground'>
                          {t('labelDescription')}
                        </h2>
                        <p className='text-sm font-medium leading-[1.6] text-muted-foreground whitespace-pre-wrap'>
                          {property.description}
                        </p>
                      </div>
                    )}

                    {hasAttributes && (
                      <div className='rounded-lg border border-primary/20 p-4'>
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
                            const displayValue =
                              attr.display_value != null &&
                              attr.display_value !== '' &&
                              attr.display_value !== 'undefined'
                                ? attr.display_value
                                : attr.value_number != null
                                  ? `${attr.value_number}${attr.unit ? ' ' + attr.unit : ''}`
                                  : attr.value_text != null
                                    ? attr.value_text
                                    : attr.value_boolean != null
                                      ? attr.value_boolean ? 'Có' : 'Không'
                                      : '—';
                            return (
                              <div key={attr.attribute_id} className='flex flex-col gap-3'>
                                <p className='text-sm font-medium leading-[1.5] text-muted-foreground'>
                                  {attr.attribute_name}
                                </p>
                                <div className='flex items-center gap-2'>
                                  <AttributeIcon
                                    iconName={attr.icon ?? attr.attribute_code}
                                    className='size-5 text-foreground/50'
                                    strokeWidth={2}
                                  />
                                  <p className='text-base font-bold tracking-[-0.09px] text-foreground'>
                                    {displayValue}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {hasAmenities && (
                      <div>
                        <h2 className='text-base font-bold tracking-[-0.24px] text-foreground mb-2'>
                          {t('labelAmenities')}
                        </h2>
                        <div className='flex flex-wrap gap-2'>
                          {property.amenities!.map((a) => (
                            <span
                              key={a.amenity_id}
                              className='rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-medium px-3 py-1'
                            >
                              {a.amenity_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Right — facts table */}
                {hasRight && (
                  <div className='sm:w-52 shrink-0'>
                    <div className='rounded-xl border border-primary/20 bg-white divide-y divide-primary/10'>
                      {facts.map((f, i) => (
                        <div key={i} className='flex items-center justify-between px-3 py-2.5 gap-3'>
                          <span className='text-xs font-medium text-muted-foreground shrink-0'>
                            {f.label}
                          </span>
                          <span className={cn('text-xs font-semibold text-right', f.accent ?? 'text-foreground')}>
                            {f.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

        {/* Tab: Agents */}
        <TabsContent value='agents' className='p-4 sm:p-6'>
          <EngagementsSection propertyId={property.property_id} />
        </TabsContent>
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

const DISMISS_KEY = 'realvista:cta:3d-tour:dismissed';

/** Wrapper that collapses when the promo banner has been dismissed */
function ThreeDPromoBannerSection() {
  const [dismissed, setDismissed] = useState(false);

  React.useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === 'true') {
      setDismissed(true);
      return;
    }
    // Watch for dismiss written by ThreeDPromoBanner
    function onStorage(e: StorageEvent) {
      if (e.key === DISMISS_KEY && e.newValue === 'true') setDismissed(true);
    }
    window.addEventListener('storage', onStorage);
    // Poll same-tab dismissal (storage events don't fire in the same tab)
    const id = setInterval(() => {
      if (localStorage.getItem(DISMISS_KEY) === 'true') setDismissed(true);
    }, 300);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, []);

  if (dismissed) return null;

  return (
    <div className='border-b border-primary/20 px-4 sm:px-6 py-4 bg-white'>
      <ThreeDPromoBanner />
    </div>
  );
}

export default function PropertyDashboardPage() {
  const t = useTranslations('PropertyDashboard');
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  const [selectedProperty, setSelectedProperty] = useState<PropertySummaryResponse | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<PropertySummaryResponse | null>(null);

  const PAGE_SIZE = 10;

  const { data: propertiesResponse, isLoading } = useQuery(
    propertyQueries.myProperties({
      keyword: debouncedSearch,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
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

  // Auto-select first property on desktop when list loads (only if nothing selected)
  React.useEffect(() => {
    if (!isMobile && properties.length > 0) {
      setSelectedProperty((prev) => prev ?? properties[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, properties]);

  // Sync selectedProperty with latest query data (e.g. after edit/update)
  React.useEffect(() => {
    if (properties.length === 0) return;
    setSelectedProperty((prev) => {
      if (!prev) return prev;
      const updated = properties.find((p) => p.property_id === prev.property_id);
      return updated && updated !== prev ? updated : prev;
    });
  }, [properties]);

  // Reset selection when filter/search changes
  const prevFilterRef = React.useRef({ debouncedSearch, statusFilter, page });
  React.useEffect(() => {
    const prev = prevFilterRef.current;
    if (
      prev.debouncedSearch !== debouncedSearch ||
      prev.statusFilter !== statusFilter ||
      prev.page !== page
    ) {
      prevFilterRef.current = { debouncedSearch, statusFilter, page };
      setSelectedProperty(null);
    }
  }, [debouncedSearch, statusFilter, page]);

  // Close filter panel on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const handleVerifyClick = (property: PropertySummaryResponse) => {
    setVerifyTarget(property);
    setIsVerifyModalOpen(true);
  };

  const hasActiveFilters = statusFilter !== 'ALL';

  const resetFilters = () => {
    setStatusFilter('ALL');
    setPage(0);
    setIsFilterOpen(false);
  };

  const statusOptions = ['ALL', ...PROPERTY_STATUSES] as const;

  return (
    <div className='flex h-full flex-col overflow-hidden sm:flex-row'>
      {/* ── Left Panel ── */}
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
                  <span className='text-sm font-bold text-white'>
                    {formatNumber(totalElements)}
                  </span>
                </div>
              </div>
              <Link
                href='/dashboard/property/create'
                className='flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              >
                <Plus className='h-3.5 w-3.5' strokeWidth={2.5} />
                <span>{t('createNew')}</span>
              </Link>
            </div>
          </div>

          {/* 3D promo banner — only renders the wrapper when banner is visible */}
          <ThreeDPromoBannerSection />

          {/* Search + Filter — same row */}
          <div className='border-b border-primary/20 p-4 sm:p-6'>
            <div className='flex items-center gap-3'>
              <div className='relative flex-1'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                  <Search className='h-5 w-5 text-muted-foreground/70' strokeWidth={2} />
                </div>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder={t('searchPlaceholder')}
                  className='h-12 w-full rounded-lg border-2 border-primary/20 bg-primary/5 pl-12 pr-4 text-base font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-0'
                />
              </div>

              {/* Filter button */}
              <div ref={filterRef} className='relative shrink-0'>
                <button
                  type='button'
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  className={cn(
                    'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    hasActiveFilters
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-primary/20 bg-white text-foreground hover:bg-primary/5'
                  )}
                  aria-label={t('filter')}
                >
                  <Filter className='h-5 w-5' strokeWidth={2} />
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', isFilterOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                  {hasActiveFilters && (
                    <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
                      1
                    </span>
                  )}
                </button>

                {/* Filter Dropdown Panel */}
                {isFilterOpen && (
                  <div className='absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-primary/20 bg-white shadow-lg'>
                    <div className='flex items-center justify-between border-b border-primary/20 px-4 py-3'>
                      <span className='text-sm font-semibold text-foreground'>{t('filter')}</span>
                      <button
                        type='button'
                        onClick={resetFilters}
                        className='cursor-pointer text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
                      >
                        {t('filterPanelReset')}
                      </button>
                    </div>
                    <div className='p-4'>
                      <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                        {t('filterPanelStatus')}
                      </p>
                      <div className='flex flex-col gap-1'>
                        {statusOptions.map((s) => (
                          <button
                            key={s}
                            type='button'
                            onClick={() => {
                              setStatusFilter(s);
                              setPage(0);
                            }}
                            className={cn(
                              'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                              statusFilter === s
                                ? 'bg-primary/5 font-medium text-primary'
                                : 'text-foreground hover:bg-primary/5'
                            )}
                          >
                            {s === 'ALL'
                              ? t('allStatuses')
                              : t(`status${s}` as Parameters<typeof t>[0])}
                            {statusFilter === s && <X className='h-3.5 w-3.5' strokeWidth={2.5} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable list */}
          <div className='flex-1 overflow-y-auto flex flex-col'>
            {isLoading ? (
              <div className='flex flex-1 items-center justify-center'>
                <Spinner className='size-8 text-primary' />
              </div>
            ) : properties.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-4 p-8 text-center flex-1'>
                <div className='flex h-12 w-14 items-center justify-center rounded-full bg-primary/10'>
                  <Home className='h-7 w-7 text-primary' strokeWidth={1.5} />
                </div>
                <div>
                  <p className='text-sm font-semibold text-foreground'>{t('noProperties')}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>{t('noPropertiesDesc')}</p>
                </div>
              </div>
            ) : (
              <div className='divide-y divide-border'>
                {properties.map((property) => (
                  <PropertyListCard
                    key={property.property_id}
                    property={property}
                    isSelected={selectedProperty?.property_id === property.property_id}
                    onClick={setSelectedProperty}
                  />
                ))}
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='py-6 bg-white border-t border-primary/20'>
                    <RealVistaPagination
                      currentPage={page + 1}
                      totalPages={totalPages}
                      onPageChange={(p) => setPage(p - 1)}
                    />
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
          <PropertyDetailPanel
            key={selectedProperty.property_id}
            property={selectedProperty}
            onVerifyClick={handleVerifyClick}
            onBack={isMobile ? () => setSelectedProperty(null) : undefined}
            onDeleted={() => setSelectedProperty(null)}
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <p className='text-sm text-muted-foreground'>{t('selectHint')}</p>
          </div>
        )}
      </main>

      {/* Verify Modal */}
      {verifyTarget && (
        <AgentVerificationModal
          isOpen={isVerifyModalOpen}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setVerifyTarget(null);
          }}
          propertyId={verifyTarget.property_id}
          ownerName={verifyTarget.owner_name || ''}
          ownerPhone={verifyTarget.owner_phone || ''}
        />
      )}
    </div>
  );
}
