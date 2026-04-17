'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Search,
  Edit,
  Home,
  ShieldCheck,
  Box,
  MapPin,
  Ruler,
  Building,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Trash2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

import { Button } from '@/shared/ui/button';
import { Link } from '@/shared/config/i18n/navigation';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Tooltip, TooltipTrigger } from '@/shared/ui/tooltip';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/shared/ui/select';
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
import { formatVND } from '@/shared/lib/utils/format-currency';
import { useIsMobile } from '@/shared/lib/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';
import { AttributeIcon } from '@/shared/ui/attribute-icon';
import { useMyEngagementsQuery } from '@/features/engagement/hooks/use-my-engagements';
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
  DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
  SOLD: 'bg-blue-50 text-blue-700 border-blue-200',
  RESERVED: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-rose-50 text-rose-700 border-rose-200',
  VERIFIED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  RENTED: 'bg-purple-50 text-purple-700 border-purple-200',
};

function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] ?? 'bg-slate-50 text-slate-600 border-slate-200';
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
        'group w-full text-left flex flex-row items-stretch gap-0 px-4 py-3 sm:px-5 sm:py-4 transition-all duration-200',
        isSelected ? 'bg-purple-96' : 'bg-white hover:bg-purple-98'
      )}
    >
      {/* Thumbnail */}
      <div className='relative w-40 h-32 flex-shrink-0 bg-gray-100 overflow-hidden rounded-lg'>
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={property.street_address}
            fill
            className='object-cover transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50'>
            <Home className='h-8 w-8 text-indigo-300' />
          </div>
        )}
        <div className='absolute top-2 left-2'>
          <Badge
            variant='outline'
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/90 backdrop-blur-sm',
              getStatusStyle(property.status)
            )}
          >
            {t(`status${property.status}` as Parameters<typeof t>[0])}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0 flex flex-col justify-between px-4 py-2 gap-2'>
        {/* Row 1: address + type */}
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <h3 className='font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-main-primary transition-colors'>
              {property.street_address}
            </h3>
            {location && (
              <div className='flex items-center gap-1 mt-0.5'>
                <MapPin className='h-3 w-3 text-gray-400 flex-shrink-0' />
                <span className='text-xs text-gray-500 truncate'>{location}</span>
              </div>
            )}
          </div>
          {property.property_type_info?.property_type_name && (
            <span className='flex-shrink-0 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-100'>
              {property.property_type_info.property_type_name}
            </span>
          )}
        </div>

        {/* Row 2: description */}
        {property.description && (
          <p className='text-xs text-gray-500 leading-relaxed line-clamp-2'>
            {property.description}
          </p>
        )}

        {/* Row 3: stats */}
        <div className='flex items-center gap-3 text-xs text-gray-500 pt-1.5 border-t border-gray-100'>
          {property.land_size_m2 != null && (
            <div className='flex items-center gap-1'>
              <Ruler className='h-3.5 w-3.5 text-gray-400' />
              <span className='font-medium'>{property.land_size_m2} m²</span>
            </div>
          )}
          {property.width_m != null && property.length_m != null ? (
            <div className='flex items-center gap-1'>
              <Ruler className='h-3.5 w-3.5 text-gray-400' />
              <span className='font-medium'>{property.width_m} × {property.length_m} m</span>
            </div>
          ) : property.width_m != null ? (
            <div className='flex items-center gap-1'>
              <Ruler className='h-3.5 w-3.5 text-gray-400' />
              <span className='font-medium'>Rộng {property.width_m} m</span>
            </div>
          ) : property.length_m != null ? (
            <div className='flex items-center gap-1'>
              <Ruler className='h-3.5 w-3.5 text-gray-400' />
              <span className='font-medium'>Dài {property.length_m} m</span>
            </div>
          ) : null}
          {/* 3D indicator — green badge if has tour, amber pulse if missing */}
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
                <Box className='h-4 w-4 text-gray-400 hover:text-amber-500 transition-colors' />
                <span className='absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 pointer-events-none'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75' />
                  <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500' />
                </span>
              </Link>
            )}
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
  const { data: listingsPage, isLoading } = useQuery(listingQueries.byProperty(propertyId));
  const listings = listingsPage?.content ?? [];

  return (
    <div>
      {/* Section header */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-bold text-slate-800'>{t('labelListings')}</h3>
          {listings.length > 0 && (
            <span className='inline-flex items-center justify-center rounded-full bg-main-primary/10 w-5 h-5 text-[11px] font-bold text-main-primary'>
              {listings.length}
            </span>
          )}
        </div>
        <Button asChild size='sm' className='rounded-lg gap-1.5 h-8 text-xs'>
          <Link href={`/dashboard/listing/create?propertyId=${propertyId}`}>
            <Plus className='h-3.5 w-3.5' />
            {t('addListing')}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-6'>
          <div className='h-5 w-5 animate-spin rounded-full border-2 border-purple-92 border-t-main-primary' />
        </div>
      ) : listings.length === 0 ? (
        <div className='rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 flex flex-col items-center gap-2 text-center'>
          <Home className='h-6 w-6 text-slate-300' />
          <p className='text-xs text-slate-400'>{t('noListings')}</p>
        </div>
      ) : (
        <div className='space-y-2.5'>
          {listings.map((listing) => {
            const typeLabel = listing.listing_type === 'RENT' ? t('listingTypeRent') : t('listingTypeSale');
            const isRent = listing.listing_type === 'RENT';
            const statusConfig: Record<string, { cls: string; label: string }> = {
              DRAFT: { cls: 'bg-slate-100 text-slate-500', label: t('listingStatusDRAFT') },
              PENDING: { cls: 'bg-amber-50 text-amber-600', label: t('listingStatusPENDING') },
              PUBLISHED: { cls: 'bg-emerald-50 text-emerald-700', label: t('listingStatusPUBLISHED') },
              SOLD: { cls: 'bg-blue-50 text-blue-700', label: t('listingStatusSOLD') },
              RENTED: { cls: 'bg-purple-50 text-purple-700', label: t('listingStatusRENTED') },
              ARCHIVED: { cls: 'bg-slate-100 text-slate-400', label: t('listingStatusARCHIVED') },
            };
            const sc = statusConfig[listing.status] ?? { cls: 'bg-slate-100 text-slate-500', label: listing.status };
            const priceDisplay = listing.is_negotiable
              ? t('negotiable')
              : listing.min_price && listing.max_price
                ? `${formatVND(listing.min_price)} – ${formatVND(listing.max_price)}`
                : formatVND(listing.price);

            return (
              <Link
                key={listing.listing_id}
                href={`/dashboard/listings?listingId=${listing.listing_id}`}
                className='flex gap-0 rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-main-primary/40 hover:shadow-sm transition-all group'
              >
                {/* Thumbnail — left column, fixed width */}
                <div className='relative w-24 flex-shrink-0 bg-slate-100'>
                  {listing.primary_media_thumbnail_url ?? listing.thumbnail ? (
                    <Image
                      src={(listing.primary_media_thumbnail_url ?? listing.thumbnail)!}
                      alt={listing.name}
                      fill
                      className='object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                  ) : (
                    <div className='h-full w-full flex items-center justify-center'>
                      <Home className='h-5 w-5 text-slate-300' />
                    </div>
                  )}
                </div>

                {/* Info — right column */}
                <div className='flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-between gap-1.5'>
                  {/* Name */}
                  <p className='text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-main-primary transition-colors'>
                    {listing.name}
                  </p>

                  {/* Type + owner row */}
                  <div className='flex items-center justify-between gap-2'>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                        isRent
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      )}
                    >
                      {typeLabel}
                    </span>
                    {listing.user_id && (
                      <span className='text-[10px] text-slate-400 font-medium truncate max-w-[80px]'>
                        {currentUserId && listing.user_id === currentUserId
                          ? t('selfPosted')
                          : t('agentPosted')}
                      </span>
                    )}
                  </div>

                  {/* Bottom row: status + price */}
                  <div className='flex items-center justify-between gap-2'>
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md', sc.cls)}>
                      {sc.label}
                    </span>
                    <p className='text-xs font-bold text-main-primary whitespace-nowrap'>
                      {priceDisplay}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ENGAGEMENT_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  SUBMITTED: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Chờ duyệt' },
  SUBMITTED_BY_OWNER: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Chờ môi giới duyệt' },
  ACCEPTED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Đã chấp nhận' },
  REJECTED: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', label: 'Từ chối' },
  CANCELLED: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-500', label: 'Đã hủy' },
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
          <h3 className='text-sm font-bold text-slate-800'>{t('labelEngagements')}</h3>
          {engagements.length > 0 && (
            <span className='inline-flex items-center justify-center rounded-full bg-amber-100 w-5 h-5 text-[11px] font-bold text-amber-700'>
              {engagements.length}
            </span>
          )}
        </div>
        <Button asChild size='sm' variant='outline' className='rounded-lg gap-1.5 h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50'>
          <Link href={`/dashboard/property/${propertyId}/delegate`}>
            <UserCheck className='h-3.5 w-3.5' />
            {t('hireAgent')}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-6'>
          <div className='h-5 w-5 animate-spin rounded-full border-2 border-purple-92 border-t-main-primary' />
        </div>
      ) : engagements.length === 0 ? (
        <div className='rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 flex flex-col items-center gap-2 text-center'>
          <User className='h-6 w-6 text-slate-300' />
          <p className='text-xs text-slate-400'>{t('noEngagements')}</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {engagements.map((e) => {
            const isOwnerInvitation = e.engagementType === 'OWNER_INVITATION';
            const statusKey =
              e.status === 'SUBMITTED' && isOwnerInvitation ? 'SUBMITTED_BY_OWNER' : e.status;
            const statusStyle = ENGAGEMENT_STATUS_STYLES[statusKey] ?? {
              bg: 'bg-slate-100 border-slate-200',
              text: 'text-slate-600',
              label: e.status,
            };
            const commission = e.content?.commissionRate ?? e.content?.offeredCommission;
            const experience = e.content?.experienceYears;
            const canDelegate =
              !isOwnerInvitation && (e.status === 'SUBMITTED' || e.status === 'ACCEPTED');

            return (
              <div
                key={e.engagementId}
                className='rounded-xl border border-slate-200 bg-white overflow-hidden'
              >
                {/* Status bar */}
                <div className={cn('px-4 py-1.5 flex items-center justify-between border-b', statusStyle.bg)}>
                  <span className={cn('text-[11px] font-bold uppercase tracking-wide', statusStyle.text)}>
                    {statusStyle.label}
                  </span>
                  <Link
                    href={`/dashboard/my-engagements?engagementId=${e.engagementId}`}
                    className={cn('flex items-center gap-1 text-[11px] font-semibold hover:underline', statusStyle.text)}
                  >
                    <Eye className='h-3.5 w-3.5' />
                    {t('viewAction')}
                  </Link>
                </div>

                {/* Card body */}
                <div className='p-4'>
                  <div className='flex items-start gap-3'>
                    {/* Avatar */}
                    <div className='h-11 w-11 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm'>
                      {e.agentAvatarUrl ? (
                        <Image
                          src={e.agentAvatarUrl}
                          alt={e.agentFullName ?? ''}
                          width={44}
                          height={44}
                          className='object-cover w-full h-full'
                        />
                      ) : (
                        <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50'>
                          <User className='h-5 w-5 text-indigo-300' />
                        </div>
                      )}
                    </div>

                    {/* Agent info */}
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-bold text-slate-800 leading-snug'>
                        {e.agentFullName ?? e.initiatorName ?? '—'}
                      </p>
                      {e.content?.title && (
                        <p className='text-xs text-slate-500 mt-0.5 line-clamp-1'>{e.content.title}</p>
                      )}
                    </div>

                    {/* Meta pills — right side */}
                    <div className='flex flex-col items-end gap-1.5 flex-shrink-0'>
                      {e.propertyTypeName && (
                        <span className='inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full'>
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
                        <span className='inline-flex items-center gap-1 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full'>
                          {experience} {t('yearsExperience')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delegate agent button */}
                  {canDelegate && (
                    <div className='mt-3 pt-3 border-t border-slate-100'>
                      <Button
                        asChild
                        size='sm'
                        variant='outline'
                        className='w-full rounded-lg gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800'
                      >
                        <Link href={`/dashboard/my-engagements?engagementId=${e.engagementId}&action=delegate`}>
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
  const [statusSelectKey, setStatusSelectKey] = useState(0);
  const queryClient = useQueryClient();

  const isOwner = !!(session?.user?.id && property.owner_id && session.user.id === property.owner_id);

  const { mutate: changeStatus, isPending: isStatusChanging } = useMutation({
    mutationFn: (status: string) =>
      propertyApi.updatePropertyStatus({ propertyId: property.property_id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'me'] });
      setStatusConfirmOpen(false);
      setPendingStatus(null);
      setStatusSelectKey((k) => k + 1);
    },
    onError: () => {
      setStatusConfirmOpen(false);
      setPendingStatus(null);
      setStatusSelectKey((k) => k + 1);
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
    <div className='h-full overflow-y-auto'>
      {/* Mobile back button */}
      {onBack && (
        <button
          type='button'
          onClick={onBack}
          className='flex items-center gap-2 px-6 py-4 text-sm font-medium text-main-primary hover:underline'
        >
          <ChevronLeft className='h-4 w-4' />
          {t('backToList')}
        </button>
      )}

      {/* Hero image / slider */}
      <div className='relative w-full h-64 bg-slate-100 overflow-hidden'>
        {currentImageUrl ? (
          <Image
            src={currentImageUrl}
            alt={property.street_address}
            fill
            className='object-cover'
          />
        ) : (
          <div className='h-full w-full flex items-center justify-center'>
            <Home className='h-16 w-16 text-slate-300' />
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

        <div className='absolute top-4 left-4'>
          {isOwner && !SYSTEM_STATUSES.has(property.status) ? (
            <Select
              key={statusSelectKey}
              onValueChange={(val) => {
                setPendingStatus(val);
                setStatusConfirmOpen(true);
              }}
            >
              <SelectTrigger
                className={cn(
                  'h-auto text-xs font-bold px-3 py-1 rounded-full border bg-white/90 backdrop-blur-sm shadow-sm gap-1.5 [&>svg]:h-3 [&>svg]:w-3',
                  getStatusStyle(property.status)
                )}
              >
                <SelectValue
                  placeholder={t(`status${property.status}` as Parameters<typeof t>[0])}
                />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_STATUSES.filter(
                  (s) => s !== property.status && !SYSTEM_STATUSES.has(s)
                ).map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status${s}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge
              variant='outline'
              className={cn(
                'text-xs font-bold px-3 py-1 rounded-full border bg-white/90 backdrop-blur-sm',
                getStatusStyle(property.status)
              )}
            >
              {t(`status${property.status}` as Parameters<typeof t>[0])}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className='p-6 space-y-6'>
        {/* Header */}
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <h2 className='text-xl font-bold text-slate-900'>{property.street_address}</h2>
            {location && (
              <div className='flex items-center gap-1.5 mt-1.5'>
                <MapPin className='h-4 w-4 text-slate-400' />
                <span className='text-sm text-slate-500'>{location}</span>
              </div>
            )}
          </div>
          <div className='flex items-center gap-2 flex-shrink-0'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant='outline' size='sm' className='rounded-lg gap-2'>
                  <Link href={`/dashboard/property/${property.property_id}/edit`}>
                    <Edit className='w-4 h-4' />
                    {t('editAction')}
                  </Link>
                </Button>
              </TooltipTrigger>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant='outline' size='sm' className='rounded-lg gap-2 border-amber-200 text-amber-700 hover:bg-amber-50'>
                  <Link href={`/dashboard/property/${property.property_id}/3d`}>
                    <Box className='w-4 h-4' />
                    {t('3dAction')}
                  </Link>
                </Button>
              </TooltipTrigger>
            </Tooltip>
            {property.status === 'PENDING' && (
              <Button
                size='sm'
                className='rounded-lg gap-2 bg-main-primary'
                onClick={() => onVerifyClick(property)}
              >
                <ShieldCheck className='w-4 h-4' />
                {t('verifyAction')}
              </Button>
            )}
          </div>
        </div>

        {/* Info grid — Type + Price + Dimensions */}
        <div className='space-y-3'>
        {/* Type + Price cards — side by side */}
          <div className='grid grid-cols-2 gap-3'>
            {/* Left: Property type */}
            {property.property_type_info?.property_type_name && (
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                <p className='text-xs text-slate-500 font-medium uppercase tracking-wide mb-1'>
                  {t('labelType')}
                </p>
                <p className='text-sm font-semibold text-slate-800'>
                  {property.property_type_info.property_type_name}
                </p>
              </div>
            )}

            {/* Right: Prices */}
            {(property.price_range?.buy || property.price_range?.rent) && (
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3'>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-[10px] font-semibold text-blue-600 uppercase tracking-wide'>Giá bán</span>
                  <span className='text-xs font-semibold text-slate-700'>
                    {property.price_range?.buy?.min != null && property.price_range?.buy?.max != null
                      ? `${formatVND(property.price_range.buy.min)} – ${formatVND(property.price_range.buy.max)} đ`
                      : property.price_range?.buy?.min != null
                        ? `Từ ${formatVND(property.price_range.buy.min)} đ`
                        : property.price_range?.buy?.max != null
                          ? `Đến ${formatVND(property.price_range.buy.max)} đ`
                          : <span className='text-slate-400 font-normal'>—</span>}
                  </span>
                </div>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-[10px] font-semibold text-emerald-600 uppercase tracking-wide'>Giá thuê</span>
                  <span className='text-xs font-semibold text-slate-700'>
                    {property.price_range?.rent?.min != null && property.price_range?.rent?.max != null
                      ? `${formatVND(property.price_range.rent.min)} – ${formatVND(property.price_range.rent.max)} đ`
                      : property.price_range?.rent?.min != null
                        ? `Từ ${formatVND(property.price_range.rent.min)} đ`
                        : property.price_range?.rent?.max != null
                          ? `Đến ${formatVND(property.price_range.rent.max)} đ`
                          : <span className='text-slate-400 font-normal'>—</span>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dimensions grid */}
          {(property.land_size_m2 != null || property.usable_size_m2 != null || property.width_m != null || property.length_m != null) && (
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1'>
                  {t('labelSize')}
                </p>
                <p className='text-sm font-semibold text-slate-800'>
                  {property.land_size_m2 != null ? `${property.land_size_m2} m²` : '—'}
                </p>
              </div>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1'>
                  Diện tích SD
                </p>
                <p className='text-sm font-semibold text-slate-800'>
                  {property.usable_size_m2 != null ? `${property.usable_size_m2} m²` : '—'}
                </p>
              </div>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1'>
                  Mặt tiền
                </p>
                <p className='text-sm font-semibold text-slate-800'>
                  {property.width_m != null ? `${property.width_m} m` : '—'}
                </p>
              </div>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                <p className='text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1'>
                  Chiều dài
                </p>
                <p className='text-sm font-semibold text-slate-800'>
                  {property.length_m != null ? `${property.length_m} m` : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <div>
            <h3 className='text-sm font-bold text-slate-700 mb-2'>{t('labelDescription')}</h3>
            <p className='text-sm text-slate-600 leading-relaxed'>{property.description}</p>
          </div>
        )}

        {/* Attributes */}
        {property.attributes && property.attributes.length > 0 && (
          <div>
            <h3 className='text-sm font-bold text-slate-700 mb-3'>{t('labelAttributes')}</h3>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6'>
              {property.attributes.map((attr) => {
                const hasValue =
                  (attr.display_value != null && attr.display_value !== '' && attr.display_value !== 'undefined') ||
                  attr.value_number != null ||
                  attr.value_text != null ||
                  attr.value_boolean != null;
                if (!hasValue) return null;

                const displayValue =
                  attr.display_value != null && attr.display_value !== '' && attr.display_value !== 'undefined'
                    ? attr.display_value
                    : attr.value_number != null
                      ? `${attr.value_number}${attr.unit ? ' ' + attr.unit : ''}`
                      : attr.value_text != null
                        ? attr.value_text
                        : attr.value_boolean != null
                          ? attr.value_boolean
                            ? 'Có'
                            : 'Không'
                          : '—';
                return (
                  <div key={attr.attribute_id} className='flex flex-col gap-4'>
                    <p className='text-main-black/50 text-[14px] font-medium leading-[1.5]'>
                      {attr.attribute_name}
                    </p>
                    <div className='flex items-center gap-2'>
                      <AttributeIcon
                        iconName={attr.icon ?? attr.attribute_code}
                        className='size-5 text-main-black/50'
                        strokeWidth={2}
                      />
                      <p className='text-main-black font-bold leading-[1.45] tracking-[-0.09px]'>
                        {displayValue}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div>
            <h3 className='text-sm font-bold text-slate-700 mb-3'>{t('labelAmenities')}</h3>
            <div className='flex flex-wrap gap-2'>
              {property.amenities.map((a) => (
                <span
                  key={a.amenity_id}
                  className='rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1'
                >
                  {a.amenity_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Listings section */}
        <ListingsSection propertyId={property.property_id} currentUserId={session?.user?.id ?? undefined} />

        {/* Engagements section — owner only */}
        {isOwner && <EngagementsSection propertyId={property.property_id} />}

        {/* Soft delete — owner only */}
        {isOwner && (
          <div className='pt-6 border-t border-slate-100'>
            <Button
              variant='ghost'
              className='w-full py-5 rounded-xl gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-dashed border-slate-200 hover:border-slate-300 transition-all'
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className='h-4 w-4' />
              <span className='text-sm font-medium'>{t('deleteProperty')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Confirm: change status */}
      <Dialog
        open={statusConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setStatusConfirmOpen(false);
            setPendingStatus(null);
            setStatusSelectKey((k) => k + 1);
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
          <p className='text-sm text-slate-600'>
            {t('confirmStatusDesc', {
              status: pendingStatus
                ? t(`status${pendingStatus}` as Parameters<typeof t>[0])
                : '',
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
              className='rounded-lg bg-main-primary'
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
          <p className='text-sm text-slate-600'>{t('confirmDeleteDesc')}</p>
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

export default function PropertyDashboardPage() {
  const t = useTranslations('PropertyDashboard');
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 500);

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

  // Auto-select first property on desktop when list loads
  React.useEffect(() => {
    if (!isMobile && !selectedProperty && properties.length > 0) {
      setSelectedProperty(properties[0]);
    }
  }, [isMobile, properties, selectedProperty]);

  // Sync selectedProperty with latest query data (e.g. after edit/update)
  React.useEffect(() => {
    if (!selectedProperty || properties.length === 0) return;
    const updated = properties.find((p) => p.property_id === selectedProperty.property_id);
    if (updated && updated !== selectedProperty) {
      setSelectedProperty(updated);
    }
  }, [properties]);

  // Reset selection when filter/search changes
  React.useEffect(() => {
    setSelectedProperty(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, page]);

  const handleVerifyClick = (property: PropertySummaryResponse) => {
    setVerifyTarget(property);
    setIsVerifyModalOpen(true);
  };

  return (
    <div className='flex h-full flex-col overflow-hidden sm:flex-row'>
      {/* ── Left Panel ── */}
      <aside
        className={cn(
          'flex-col border-r border-purple-92/50 bg-white transition-all duration-300',
          isMobile ? (selectedProperty ? 'hidden' : 'flex w-full') : 'flex w-[42%]'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='p-4 sm:p-6 bg-white'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-3'>
                <h2 className='text-xl font-extrabold text-main-black tracking-tight'>
                  {t('pageTitle')}
                </h2>
                <div className='flex items-center justify-center rounded-full bg-main-primary/10 px-3 py-0.5 border border-main-primary/20 shadow-sm'>
                  <span className='text-sm font-bold text-main-primary'>{totalElements}</span>
                </div>
              </div>
              <Button asChild size='sm' className='rounded-full gap-1.5 shrink-0'>
                <Link href='/dashboard/property/create'>
                  <Plus className='w-4 h-4' />
                  {t('createNew')}
                </Link>
              </Button>
            </div>
          </div>

          {/* 3D promo banner — pinned above search */}
          <div className='border-b border-purple-92/40 px-4 sm:px-6 py-4 bg-white'>
            <ThreeDPromoBanner />
          </div>

          {/* Search + Status Filter — same row */}
          <div className='border-b border-purple-92/40 px-4 sm:px-6 py-4 bg-purple-98/30'>
            <div className='flex items-center gap-2'>
              {/* Search */}
              <div className='relative group flex-1'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                  <Search className='h-[18px] w-[18px] text-main-secondary/50 group-focus-within:text-main-primary transition-colors' />
                </div>
                <Input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder={t('searchPlaceholder')}
                  className='h-10 w-full rounded-xl border border-purple-92 bg-white pl-11 pr-4 text-sm font-medium text-main-black shadow-sm placeholder:text-main-secondary/50 hover:border-main-primary/50 focus:border-main-primary focus:ring-4 focus:ring-main-primary/10 transition-all duration-300'
                />
              </div>
              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className='w-[160px] rounded-xl border-purple-92 h-10 shrink-0'>
                  <SelectValue placeholder={t('filterStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>{t('allStatuses')}</SelectItem>
                  {PROPERTY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`status${s}` as Parameters<typeof t>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scrollable list */}
          <div className='flex-1 overflow-y-auto bg-gray-50/20'>
            {isLoading ? (
              <div className='flex h-full items-center justify-center'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-92 border-t-main-primary' />
              </div>
            ) : properties.length === 0 ? (
              <div className='flex flex-col items-center justify-center gap-4 p-12 text-center animate-in fade-in duration-500'>
                <div className='flex h-20 w-20 items-center justify-center rounded-full bg-purple-98 border border-purple-92/50 shadow-sm'>
                  <Home className='h-8 w-8 text-main-primary/60' strokeWidth={1.5} />
                </div>
                <div className='max-w-[280px]'>
                  <p className='text-base font-bold text-main-black'>{t('noProperties')}</p>
                  <p className='mt-1.5 text-sm text-main-secondary/70'>{t('noPropertiesDesc')}</p>
                </div>
              </div>
            ) : (
              <div className='divide-y divide-purple-92/40'>
                {properties.map((property) => (
                  <div key={property.property_id} className='transition-colors'>
                    <PropertyListCard
                      property={property}
                      isSelected={selectedProperty?.property_id === property.property_id}
                      onClick={setSelectedProperty}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='border-t border-purple-92/40 flex items-center justify-between px-4 py-3 bg-white'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className='rounded-lg'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <span className='text-sm text-slate-500'>
                {t('pageInfo', { current: page + 1, total: totalPages })}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className='rounded-lg'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Right Detail Panel ── */}
      <main
        className={cn(
          'flex-1 overflow-y-auto bg-purple-98/40',
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
          <div className='flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500'>
            <div className='mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border border-purple-92/50'>
              <Building className='h-10 w-10 text-main-primary/30' strokeWidth={1.5} />
            </div>
            <p className='text-base font-medium text-main-secondary/80 max-w-[250px]'>
              {t('selectHint')}
            </p>
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
