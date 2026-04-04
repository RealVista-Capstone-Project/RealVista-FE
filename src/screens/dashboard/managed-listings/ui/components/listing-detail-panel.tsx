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
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  Eye,
  Mail,
  Phone,
  ChevronDown,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { format, isPast, isToday, parseISO } from 'date-fns';

interface ListingDetailPanelProps {
  listing: Listing;
  onBack?: () => void;
}

export function ListingDetailPanel({ listing, onBack }: ListingDetailPanelProps) {
  const t = useTranslations('ListingDetailPanel');
  const property: Property = mapListingToProperty(listing);
  console.log(`Listing user: ${listing.user_id}`);

  const { data: session } = useAuthSession();
  const router = useRouter();
  const params = useParams();
  const { openWindow } = useChatWindowStore();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const deleteMutation = useDeleteListing();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(listing.listing_id);
      setIsDeleteDialogOpen(false);
      if (onBack) onBack();
    } catch (error) {
      console.error('Failed to delete listing:', error);
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
        conversationQueries.detailOrCreate(listing.agent.user_id)
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
            id: listing.agent.user_id,
            name: listing.agent.full_name,
            avatar: listing.agent.avatar_url,
          });
        }
      }
    } catch (error) {
      console.error('Failed to create or get conversation:', error);
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
      ? format(availabilityDate, 'PP')
      : t('features.availableImmediately');

  return (
    <div className='min-h-full bg-white pb-20 sm:pb-8'>
      {/* Mobile Back Button */}
      {onBack && (
        <div className='sticky top-0 z-20 flex items-center border-b border-purple-92 bg-white px-4 py-3 sm:hidden'>
          <button
            onClick={onBack}
            className='flex items-center gap-2 text-sm font-semibold text-main-black'
          >
            <ArrowLeft className='h-5 w-5' strokeWidth={2.5} />
            <span>{t('backToList')}</span>
          </button>

          <Link
            href={`/listing/${listing.slug}`}
            className='flex items-center gap-2 rounded-lg border border-purple-92 bg-white px-3 py-1.5 text-xs font-bold text-main-black transition-colors hover:bg-purple-98'
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
      <div className='px-4 sm:px-12 py-6 sm:py-8'>
        {/* Header with Title, Status Actions, and Calendar Button */}
        <div className='mb-6 flex flex-col gap-4'>
          <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
            <div className='flex flex-col gap-2'>
              <h1 className='text-2xl sm:text-[32px] font-bold leading-tight sm:leading-[1.25] tracking-tight sm:tracking-[-0.32px] text-main-black'>
                {property.title}
              </h1>
              <p className='text-sm sm:text-base font-medium leading-relaxed sm:leading-[1.6] text-main-black/50'>
                {property.address || t('addressNotAvailable')}
              </p>
            </div>

            <div className='flex flex-col items-center gap-2 sm:shrink-0 sm:items-end relative'>
              <div className='relative w-full sm:w-auto'>
                <button
                  type='button'
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className='flex w-full whitespace-nowrap sm:w-auto items-center justify-center gap-2 rounded-lg border border-purple-92 bg-white px-4 py-2.5 text-sm font-medium text-main-black transition-colors hover:bg-purple-98 shadow-sm'
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
                  <div className='absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-purple-92 bg-white shadow-lg p-2 flex flex-col gap-1'>
                    <button
                      type='button'
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsEditModalOpen(true);
                      }}
                      className='flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-main-black hover:bg-purple-98 rounded-lg transition-colors font-medium'
                    >
                      <Pencil className='h-4 w-4' strokeWidth={2} />
                      <span>{t('editListing')}</span>
                    </button>
                    <Link
                      href={`/listing/${listing.slug}`}
                      onClick={() => setIsActionsOpen(false)}
                      className='flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-main-black hover:bg-purple-98 rounded-lg transition-colors font-medium'
                    >
                      <Eye className='h-4 w-4' strokeWidth={2} />
                      <span>{t('preview')}</span>
                    </Link>
                    <button
                      type='button'
                      onClick={() => setIsActionsOpen(false)}
                      className='flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-main-black hover:bg-purple-98 rounded-lg transition-colors font-medium'
                    >
                      <Calendar className='h-4 w-4' strokeWidth={2} />
                      <span>{t('showCalendar')}</span>
                    </button>
                    <div className='my-1 h-px bg-purple-92/50' />
                    <button
                      type='button'
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                      className='flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium'
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
        <div className='mb-8'>
          <ListingMetricsCard listingId={listing.listing_id} />
        </div>

        {/* Agent Information Card - Show when listing is created by agent (not property owner) */}
        {showAgentInfo && (
          <div className='mb-8 overflow-hidden rounded-xl border border-purple-92 bg-gradient-to-br from-purple-98 to-white shadow-sm'>
            <div className='p-6'>
              {/* Header */}
              <div className='mb-4 flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-main-primary/10'>
                  <Building2 className='h-4 w-4 text-main-primary' strokeWidth={2} />
                </div>
                <div>
                  <h3 className='text-sm font-semibold text-main-black'>{t('agent.title')}</h3>
                  <p className='text-xs text-main-secondary/60'>{t('agent.subtitle')}</p>
                </div>
              </div>

              {/* Agent Card */}
              <div className='flex items-start gap-4 rounded-lg border border-purple-92 bg-white p-4'>
                {/* Avatar */}
                <div className='relative shrink-0'>
                  {listing.agent.avatar_url ? (
                    <Image
                      src={listing.agent.avatar_url}
                      alt={listing.agent.full_name}
                      width={56}
                      height={56}
                      className='h-14 w-14 rounded-full object-cover'
                    />
                  ) : (
                    <div className='flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-main-primary to-purple-600'>
                      <span className='text-lg font-bold text-white'>
                        {listing.agent.first_name?.[0]}
                        {listing.agent.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  {listing.agent.is_verified && (
                    <div className='absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white'>
                      <BadgeCheck className='h-4 w-4 fill-blue-500 text-white' strokeWidth={2} />
                    </div>
                  )}
                </div>

                {/* Agent Details */}
                <div className='flex-1 space-y-3'>
                  {/* Name and verification */}
                  <div>
                    <h4 className='text-lg font-bold text-main-black'>
                      {listing.agent.business_name || listing.agent.full_name}
                    </h4>
                    {listing.agent.business_name && listing.agent.full_name && (
                      <p className='text-sm text-main-secondary/70'>{listing.agent.full_name}</p>
                    )}
                    {listing.agent.is_verified && (
                      <div className='mt-1 flex items-center gap-1.5'>
                        <BadgeCheck className='h-3.5 w-3.5 text-blue-500' strokeWidth={2} />
                        <span className='text-xs font-medium text-blue-600'>
                          {t('agent.verified')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                    {listing.agent.phone && (
                      <div className='flex items-center gap-2 rounded-lg bg-purple-98 px-3 py-2'>
                        <Phone className='h-4 w-4 shrink-0 text-main-primary' strokeWidth={2} />
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-medium text-main-secondary/60'>
                            {t('agent.phone')}
                          </p>
                          <p className='truncate text-sm font-semibold text-main-black'>
                            {listing.agent.phone}
                          </p>
                        </div>
                      </div>
                    )}
                    {listing.agent.email && (
                      <div className='flex items-center gap-2 rounded-lg bg-purple-98 px-3 py-2'>
                        <Mail className='h-4 w-4 shrink-0 text-main-primary' strokeWidth={2} />
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-medium text-main-secondary/60'>
                            {t('agent.email')}
                          </p>
                          <p className='truncate text-sm font-semibold text-main-black'>
                            {listing.agent.email}
                          </p>
                        </div>
                      </div>
                    )}
                    {listing.agent.company && (
                      <div className='flex items-center gap-2 rounded-lg bg-purple-98 px-3 py-2 sm:col-span-2'>
                        <Building2 className='h-4 w-4 shrink-0 text-main-primary' strokeWidth={2} />
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-medium text-main-secondary/60'>
                            {t('agent.company')}
                          </p>
                          <p className='truncate text-sm font-semibold text-main-black'>
                            {listing.agent.company}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Button */}
                  <button
                    type='button'
                    onClick={handleContact}
                    className='w-full rounded-lg bg-main-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-main-primary/90 hover:shadow-md'
                  >
                    {t('agent.contact')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Stats - Dynamic attributes from server */}
        <div className='mb-8 rounded-lg border border-purple-92 p-6'>
          {attributes.length > 0 ? (
            <div className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-6'>
              {listing.listing_type === 'RENT' && (
                <FeatureStat
                  label={t('features.availableFrom')}
                  value={displayAvailableFrom}
                  icon='📅'
                />
              )}
              {attributes.map((attribute) => (
                <div key={attribute.attribute_id} className='flex flex-col gap-4'>
                  <p className='text-base font-medium leading-[1.5] text-grey-500'>
                    {attribute.attribute_name}
                  </p>
                  <div className='flex items-center gap-2'>
                    <AttributeIcon
                      iconName={attribute.icon}
                      className='size-6 text-main-black/50'
                      strokeWidth={2}
                    />
                    <p className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
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
                  icon='📅'
                />
              )}
              <FeatureStat
                label={t('features.properties')}
                value={t('features.notAvailable')}
                icon='🏠'
              />
              <FeatureStat
                label={t('features.rooms')}
                value={t('features.notAvailable')}
                icon='🛏️'
              />
              <FeatureStat
                label={t('features.livingSpace')}
                value={`${listing.property?.usable_size_m2 || 0} m²`}
                icon='📐'
              />
              <FeatureStat
                label={t('features.yearBuilt')}
                value={t('features.notAvailable')}
                icon='📅'
              />
              <FeatureStat label={t('features.tenants')} value='12' icon='👥' />
              <FeatureStat label={t('features.request')} value='12' icon='📄' />
            </div>
          )}
        </div>

        {/* About this listing */}
        <div className='mb-8 flex flex-col gap-4'>
          <h2 className='text-xl font-bold leading-[1.5] tracking-[-0.24px] text-main-black'>
            {t('aboutThisListing', { fallback: 'About this listing' })}
          </h2>
          <p className='text-base font-medium leading-[1.6] text-main-black/70 whitespace-pre-wrap font-sans'>
            {listing.content || property.description}
          </p>
        </div>

        <div className='mb-8 h-px w-full bg-purple-92' />

        {/* Rental Features Section */}
        {property.amenities && property.amenities.length > 0 && (
          <div className='mb-8'>
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
              className='flex h-11 items-center justify-center rounded-lg border border-purple-92 bg-white px-6 text-sm font-bold text-main-black transition-colors hover:bg-purple-98'
              disabled={deleteMutation.isPending}
            >
              {t('deleteConfirmCancel', { fallback: 'Cancel' })}
            </button>
            <button
              type='button'
              onClick={handleDelete}
              className='flex h-11 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-bold text-white transition-all hover:bg-red-700 shadow-[0px_4px_12px_0px_rgba(220,38,38,0.2)] disabled:opacity-50 disabled:cursor-not-allowed'
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

function FeatureStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className='flex flex-col gap-4'>
      <p className='text-base font-medium leading-[1.5] text-grey-500'>{label}</p>
      <div className='flex items-center gap-2'>
        <span className='text-2xl opacity-50'>{icon}</span>
        <p className='text-lg font-bold leading-[1.45] tracking-[-0.09px] text-main-black'>
          {value}
        </p>
      </div>
    </div>
  );
}
