'use client';

import { useChatWindowStore } from '@/entities/contact';
import { conversationQueries } from '@/entities/conversation';
import type { Listing } from '@/entities/listing';
import { mapListingToProperty } from '@/entities/listing/lib/listing-to-property.mapper';
import type { Property } from '@/entities/property';
import { isAuthenticated, useAuthSession } from '@/features/auth/model';
import { EditListingModal } from '@/features/edit-listing-modal';
import { ListingMetricsCard } from '@/features/listing-analytics';
import { ListingStatusActions } from '@/features/listing-status';
import { PropertyGallery } from '@/features/property-gallery';
import { RentalFeatures } from '@/features/rental-features';
import { useDeleteListing } from '@/features/edit-listing-modal/api/use-delete-listing';
import { handleErrorApi } from '@/shared/lib/utils/handle-error';
import { ListingLifetimeCard } from './listing-lifetime-card';
import { ListingBoostSection } from './listing-boost-section';
import { Link } from '@/shared/config/i18n/navigation';
import { useIsMobile } from '@/shared/lib/hooks/use-mobile';
import { AttributeIcon } from '@/shared/ui/attribute-icon';
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
  Pencil,
  Trash2,
  CalendarDays,
  Calendar,
  Home,
  BedDouble,
  Ruler,
  Users,
  FileText,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ListingDetailPanelProps {
  listing: Listing;
  onBack?: () => void;
}

export function ListingDetailPanel({ listing, onBack }: ListingDetailPanelProps) {
  const t = useTranslations('ListingDetailPanel');
  const tGlobal = useTranslations();
  const property: Property = mapListingToProperty(listing);

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
          router.push(`/${locale}/messages/${conversationId}`);
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

  return (
    <div className='min-h-full bg-white pb-20 sm:pb-8'>
      {/* Mobile Back Button */}
      {onBack && (
        <div className='sticky top-0 z-20 flex items-center border-b border-primary/20 bg-white px-4 py-3 sm:hidden'>
          <button
            onClick={onBack}
            className='flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
          >
            <ArrowLeft className='h-5 w-5' strokeWidth={2.5} />
            <span>{t('backToList')}</span>
          </button>

          <Link
            href={`/listing/${listing.slug}`}
            className='flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-primary/5'
          >
            <Eye className='h-3.5 w-3.5' strokeWidth={2.5} />
            <span>{t('preview')}</span>
          </Link>
        </div>
      )}

      {/* Property Gallery - matches listing-detail-screen */}
      <div className='px-4 sm:px-12 pt-4 sm:pt-8'>
        <PropertyGallery key={listing.listing_id} images={property.images} />
      </div>

      {/* Content */}
      <div className='flex flex-col gap-8 px-4 sm:px-12 py-6 sm:py-8'>
        {/* Header with Title, Status Actions, and Calendar Button */}
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
            <div className='flex flex-col gap-2'>
              <h1 className='text-2xl sm:text-[32px] font-bold leading-tight sm:leading-[1.25] tracking-tight sm:tracking-[-0.32px] text-foreground'>
                {property.title}
              </h1>
              <p className='text-sm sm:text-base font-medium leading-relaxed sm:leading-[1.6] text-muted-foreground'>
                {property.address || t('addressNotAvailable')}
              </p>
            </div>

            <div className='flex flex-col items-center gap-2 sm:shrink-0 sm:items-end relative'>
              <div className='relative w-full sm:w-auto' ref={actionsRef}>
                <button
                  type='button'
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className='flex w-full cursor-pointer whitespace-nowrap sm:w-auto items-center justify-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
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
                      className='flex cursor-pointer items-center gap-2 w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
                    >
                      <Pencil className='h-4 w-4' strokeWidth={2} />
                      <span>{t('editListing')}</span>
                    </button>
                    <Link
                      href={`/listing/${listing.slug}`}
                      onClick={() => setIsActionsOpen(false)}
                      className='flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium'
                    >
                      <Eye className='h-4 w-4' strokeWidth={2} />
                      <span>{t('preview')}</span>
                    </Link>
                    <Link
                      href={`/dashboard/appointments?listing=${listing.listing_id}`}
                      onClick={() => setIsActionsOpen(false)}
                      className='flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/5 rounded-lg transition-colors font-medium'
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
                      className='flex cursor-pointer items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1'
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
          />
        </div>

        {/* Listing Analytics Metrics */}
        <div>
          <ListingMetricsCard listingId={listing.listing_id} />
        </div>

        {/* Agent + Boost - Side by Side */}
        {(showAgentInfo || (listing.status === 'PUBLISHED' && !!listing.published_at)) && (
          <div className='flex w-full flex-col sm:flex-row gap-4'>
            {/* Agent Information Card */}
            {showAgentInfo && (
            <div className='flex-1 overflow-hidden rounded-xl border border-primary/20 bg-primary/5 shadow-sm'>
              <div className='p-6'>
                {/* Header */}
                <div className='mb-4 flex items-center gap-2'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                    <Building2 className='h-4 w-4 text-primary' strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-foreground'>{t('agent.title')}</h3>
                    <p className='text-xs text-muted-foreground'>{t('agent.subtitle')}</p>
                  </div>
                </div>

                {/* Agent Card */}
                <div className='flex items-start gap-4 rounded-lg border border-primary/20 bg-white p-4'>
                  {/* Avatar */}
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

                  {/* Agent Details */}
                  <div className='flex-1 space-y-3'>
                    {/* Name and verification */}
                    <div>
                      <h4 className='text-lg font-bold text-foreground'>
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

                    {/* Contact Info */}
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

                    {/* Contact Button */}
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
            </div>
          )}

          {/* Boost Section */}
          {listing.status === 'PUBLISHED' && listing.published_at && (
            <div className='flex flex-1 flex-col gap-4'>
              {/* Listing Lifetime - Above Metrics */}
              <div className='rounded-lg border border-primary/20 bg-primary/5 p-4'>
                <ListingLifetimeCard listing={listing} />
              </div>
              <ListingBoostSection listing={listing} />
            </div>
          )}
          </div>
        )}

        {/* Features Stats - Dynamic attributes from server */}
        <div className='rounded-lg border border-primary/20 p-6'>
          {attributes.length > 0 ? (
            <div className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-6'>
              {listing.listing_type === 'RENT' && (
                <FeatureStat
                  label={t('features.availableFrom')}
                  value={displayAvailableFrom}
                  icon={Calendar}
                />
              )}
              {attributes.map((attribute) => (
                <div key={attribute.attribute_id} className='flex flex-col gap-4'>
                  <p className='text-base font-medium leading-[1.5] text-muted-foreground'>
                    {attribute.attribute_name}
                  </p>
                  <div className='flex items-center gap-2'>
                    <AttributeIcon
                      iconName={attribute.icon}
                      className='size-6 text-foreground/50'
                      strokeWidth={2}
                    />
                    <p className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-foreground'>
                      {attribute.display_value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Fallback when no attributes are available
            <div className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-6'>
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
              <FeatureStat label={t('features.tenants')} value='12' icon={Users} />
              <FeatureStat label={t('features.request')} value='12' icon={FileText} />
            </div>
          )}
        </div>

        {/* About this listing */}
        <div className='flex flex-col gap-4'>
          <h2 className='text-xl font-bold leading-[1.5] tracking-[-0.24px] text-foreground'>
            {t('aboutThisListing', { fallback: 'About this listing' })}
          </h2>
          <p className='text-base font-medium leading-[1.6] text-muted-foreground whitespace-pre-wrap font-sans'>
            {listing.content || property.description}
          </p>
        </div>

        <div className='h-px w-full bg-primary/15' />

        {/* Rental Features Section */}
        {property.amenities && property.amenities.length > 0 && (
          <div>
            <RentalFeatures property={property} />
          </div>
        )}
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
      <p className='text-base font-medium leading-[1.5] text-muted-foreground'>{label}</p>
      <div className='flex items-center gap-2'>
        <Icon className='size-6 text-foreground/50' strokeWidth={2} />
        <p className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-foreground'>
          {value}
        </p>
      </div>
    </div>
  );
}
