'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { OwnerPropertySummary } from '@/entities/property';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import {
  MapPin,
  Home,
  Ruler,
  Phone,
  Mail,
  User,
  SendHorizonal,
  Building2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { formatVND } from '@/shared/lib/utils/format-currency';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { SubmitProposalModal } from './submit-proposal-modal';
import { useSubmitProposalMutation } from '../hooks/use-submit-proposal';
import { useOwnerPropertiesContext, type ListingType } from '../model/owner-properties-context';

interface OwnerPropertySheetProps {
  property: OwnerPropertySummary | null;
  onClose: () => void;
}

interface OwnerPropertyDetailPanelProps {
  property: OwnerPropertySummary;
  onBack?: () => void;
}

function getStatusStyle(status: string): string {
  switch (status.toUpperCase()) {
    case 'AVAILABLE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'VERIFIED':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}

function formatArea(size: number | null): string | null {
  if (!size) return null;
  return `${size} m²`;
}

function formatPriceRange(
  priceRange: { min: number | null; max: number | null } | undefined
): string | null {
  if (!priceRange) return null;
  const { min, max } = priceRange;
  if (min && max) return `${formatVND(min)} – ${formatVND(max)}`;
  if (min) return `${formatVND(min)}+`;
  if (max) return `≤ ${formatVND(max)}`;
  return null;
}

function PriceBadges({
  property,
  listingType,
}: {
  property: OwnerPropertySummary;
  listingType: ListingType;
}) {
  const t = useTranslations('OwnerProperties');
  const rentDisplay = formatPriceRange(property.price_range?.rent);
  const buyDisplay = formatPriceRange(property.price_range?.buy);

  const showRent = listingType === 'ALL' || listingType === 'RENT';
  const showBuy = listingType === 'ALL' || listingType === 'SELL';

  if (!rentDisplay && !buyDisplay) return null;

  return (
    <div className='flex flex-wrap gap-2'>
      {showRent && rentDisplay && (
        <span className='text-sm font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200'>
          {t('card.rent')}: {rentDisplay}
        </span>
      )}
      {showBuy && buyDisplay && (
        <span className='text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200'>
          {t('card.buy')}: {buyDisplay}
        </span>
      )}
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className='bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col gap-1.5'>
      <div className='flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wide'>
        {icon}
        {label}
      </div>
      <div className='font-bold text-gray-900 text-sm truncate'>{value}</div>
    </div>
  );
}

export function OwnerPropertySheet({ property, onClose }: OwnerPropertySheetProps) {
  const t = useTranslations('OwnerProperties');
  const { listingType } = useOwnerPropertiesContext();
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const submitProposalMutation = useSubmitProposalMutation();

  const handleProposalSubmit = useCallback(
    async (values: { message: string; offered_commission: string }) => {
      if (!property) return;
      try {
        await submitProposalMutation.mutateAsync({
          property_id: property.property_id,
          message: values.message,
          offered_commission: values.offered_commission,
        });
        setProposalModalOpen(false);
        toast.success(t('toast.proposalSuccess'));
      } catch {
        toast.error(t('toast.proposalError'));
      }
    },
    [property, submitProposalMutation, t]
  );

  if (!property) return null;

  const thumbnailUrl =
    property.media?.find((m) => m.is_primary)?.media_url ??
    property.media?.[0]?.media_url;

  const location = [
    property.location_info?.ward_name,
    property.location_info?.district_name,
    property.location_info?.city_name,
  ]
    .filter(Boolean)
    .join(', ');

  const usableArea = formatArea(property.usable_size_m2);
  const landArea = formatArea(property.land_size_m2);

  const bedroomsAttr = property.attributes?.find((a) => a.attribute_code === 'BEDROOMS');
  const bathroomsAttr = property.attributes?.find((a) => a.attribute_code === 'BATHROOMS');
  const floorsAttr = property.attributes?.find((a) => a.attribute_code === 'FLOORS');

  return (
    <>
      <Sheet open={!!property} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent
          side='right'
          className='w-full sm:max-w-[480px] p-0 flex flex-col gap-0 overflow-hidden'
        >
          {/* Hidden title for accessibility */}
          <SheetHeader className='sr-only'>
            <SheetTitle>{t('detailPanel.title')}</SheetTitle>
          </SheetHeader>

          {/* Hero image */}
          <div className='relative h-56 w-full bg-gray-100 flex-shrink-0'>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={property.street_address}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50'>
                <Home className='h-14 w-14 text-indigo-200' />
              </div>
            )}
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent' />

            {/* Overlaid address + status */}
            <div className='absolute bottom-0 left-0 right-0 px-5 pb-4'>
              <div className='flex items-end justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  <h2 className='text-white font-bold text-base leading-tight line-clamp-2'>
                    {property.street_address}
                  </h2>
                  {location && (
                    <div className='flex items-center gap-1 mt-1'>
                      <MapPin className='h-3 w-3 text-white/70 flex-shrink-0' />
                      <span className='text-xs text-white/80 truncate'>{location}</span>
                    </div>
                  )}
                </div>
                <Badge
                  variant='outline'
                  className={cn(
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 bg-white/90 backdrop-blur-sm',
                    getStatusStyle(property.status)
                  )}
                >
                  {property.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className='flex-1 overflow-y-auto'>
            <div className='p-5 space-y-6'>

              {/* Property type + category */}
              {property.property_type_info && (
                <div className='flex items-center gap-2'>
                  <Building2 className='h-4 w-4 text-indigo-500 flex-shrink-0' />
                  <span className='text-sm font-semibold text-gray-800'>
                    {property.property_type_info.property_type_name}
                  </span>
                  {property.property_type_info.property_category_name && (
                    <>
                      <span className='text-gray-300'>·</span>
                      <span className='text-sm text-gray-500'>
                        {property.property_type_info.property_category_name}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Price range */}
              <PriceBadges property={property} listingType={listingType} />

              {/* Stats tiles */}
              <div className='grid grid-cols-2 gap-3'>
                {usableArea && (
                  <InfoTile
                    label={t('detailPanel.usableArea')}
                    value={usableArea}
                    icon={<Ruler className='h-3 w-3' />}
                  />
                )}
                {landArea && (
                  <InfoTile
                    label={t('detailPanel.landArea')}
                    value={landArea}
                    icon={<Ruler className='h-3 w-3' />}
                  />
                )}
                {bedroomsAttr?.value_number != null && (
                  <InfoTile
                    label={t('detailPanel.bedrooms')}
                    value={String(bedroomsAttr.value_number)}
                    icon={<Home className='h-3 w-3' />}
                  />
                )}
                {bathroomsAttr?.value_number != null && (
                  <InfoTile
                    label={t('detailPanel.bathrooms')}
                    value={String(bathroomsAttr.value_number)}
                    icon={<Home className='h-3 w-3' />}
                  />
                )}
                {floorsAttr?.value_number != null && (
                  <InfoTile
                    label={t('detailPanel.floors')}
                    value={String(floorsAttr.value_number)}
                    icon={<Building2 className='h-3 w-3' />}
                  />
                )}
              </div>

              {/* Description */}
              {property.descriptions && (
                <section>
                  <h4 className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5'>
                    {t('detailPanel.description')}
                  </h4>
                  <p className='text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100'>
                    {property.descriptions}
                  </p>
                </section>
              )}

              <Separator className='bg-gray-100' />

              {/* Owner info */}
              <section>
                <h4 className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3'>
                  {t('detailPanel.ownerInfo')}
                </h4>
                <div className='space-y-3'>
                  {property.owner_name && (
                    <div className='flex items-center gap-3'>
                      <div className='h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0'>
                        <User className='h-4 w-4 text-indigo-500' />
                      </div>
                      <div>
                        <div className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                          {t('detailPanel.ownerName')}
                        </div>
                        <div className='text-sm font-semibold text-gray-800'>
                          {property.owner_name}
                        </div>
                      </div>
                    </div>
                  )}
                  {property.owner_phone && (
                    <div className='flex items-center gap-3'>
                      <div className='h-9 w-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0'>
                        <Phone className='h-4 w-4 text-green-500' />
                      </div>
                      <div>
                        <div className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                          {t('detailPanel.phone')}
                        </div>
                        <div className='text-sm font-semibold text-gray-800'>
                          {property.owner_phone}
                        </div>
                      </div>
                    </div>
                  )}
                  {property.owner_email && (
                    <div className='flex items-center gap-3'>
                      <div className='h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0'>
                        <Mail className='h-4 w-4 text-orange-500' />
                      </div>
                      <div>
                        <div className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>
                          {t('detailPanel.email')}
                        </div>
                        <div className='text-sm font-semibold text-gray-800 truncate'>
                          {property.owner_email}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Sticky CTA footer */}
          <div className='p-4 border-t border-gray-100 bg-white flex-shrink-0'>
            {property.has_active_proposal ? (
              <div className='w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm'>
                <CheckCircle2 className='h-4 w-4' />
                {t('detailPanel.alreadyProposed')}
              </div>
            ) : (
              <Button
                className='w-full bg-main-primary hover:bg-main-primary-hover text-white font-semibold rounded-xl h-11 gap-2 shadow-sm shadow-indigo-200/60 text-sm'
                onClick={() => setProposalModalOpen(true)}
              >
                <SendHorizonal className='h-4 w-4' />
                {t('detailPanel.submitProposal')}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Proposal modal (opened from sheet) */}
      <SubmitProposalModal
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
        property={property}
        onSubmit={handleProposalSubmit}
        isLoading={submitProposalMutation.isPending}
      />
    </>
  );
}

/**
 * Inline detail panel — renders directly inside the right-side main area
 * (used by the two-panel layout in OwnerPropertiesPage).
 */
export function OwnerPropertyDetailPanel({ property, onBack }: OwnerPropertyDetailPanelProps) {
  const t = useTranslations('OwnerProperties');
  const { listingType } = useOwnerPropertiesContext();
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const submitProposalMutation = useSubmitProposalMutation();

  const handleProposalSubmit = useCallback(
    async (values: { message: string; offered_commission: string }) => {
      try {
        await submitProposalMutation.mutateAsync({
          property_id: property.property_id,
          message: values.message,
          offered_commission: values.offered_commission,
        });
        setProposalModalOpen(false);
        toast.success(t('toast.proposalSuccess'));
      } catch {
        toast.error(t('toast.proposalError'));
      }
    },
    [property, submitProposalMutation, t]
  );

  const thumbnailUrl =
    property.media?.find((m) => m.is_primary)?.media_url ?? property.media?.[0]?.media_url;

  const location = [
    property.location_info?.ward_name,
    property.location_info?.district_name,
    property.location_info?.city_name,
  ]
    .filter(Boolean)
    .join(', ');

  const usableArea = formatArea(property.usable_size_m2);
  const landArea = formatArea(property.land_size_m2);
  const bedroomsAttr = property.attributes?.find((a) => a.attribute_code === 'BEDROOMS');
  const bathroomsAttr = property.attributes?.find((a) => a.attribute_code === 'BATHROOMS');
  const floorsAttr = property.attributes?.find((a) => a.attribute_code === 'FLOORS');

  return (
    <>
      <div className='flex h-full flex-col bg-white'>
        {/* Mobile back button */}
        {onBack && (
          <div className='sticky top-0 z-20 flex items-center border-b border-purple-92 bg-white px-4 py-3 sm:hidden'>
            <button
              onClick={onBack}
              className='flex items-center gap-2 text-sm font-semibold text-main-black'
            >
              <ArrowLeft className='h-5 w-5' strokeWidth={2.5} />
              <span>{t('detailPanel.backToList')}</span>
            </button>
          </div>
        )}

        {/* Hero image */}
        <div className='relative h-56 w-full flex-shrink-0 bg-gray-100'>
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={property.street_address}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50'>
              <Home className='h-14 w-14 text-indigo-200' />
            </div>
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent' />

          {/* Overlaid address + status */}
          <div className='absolute bottom-0 left-0 right-0 px-5 pb-4'>
            <div className='flex items-end justify-between gap-3'>
              <div className='min-w-0 flex-1'>
                <h2 className='text-base font-bold leading-tight text-white line-clamp-2'>
                  {property.street_address}
                </h2>
                {location && (
                  <div className='mt-1 flex items-center gap-1'>
                    <MapPin className='h-3 w-3 flex-shrink-0 text-white/70' />
                    <span className='truncate text-xs text-white/80'>{location}</span>
                  </div>
                )}
              </div>
              <Badge
                variant='outline'
                className={cn(
                  'flex-shrink-0 rounded-full border bg-white/90 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm',
                  getStatusStyle(property.status)
                )}
              >
                {property.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className='flex-1 overflow-y-auto'>
          <div className='space-y-6 p-5 sm:p-8'>
            {/* Property type + category */}
            {property.property_type_info && (
              <div className='flex items-center gap-2'>
                <Building2 className='h-4 w-4 flex-shrink-0 text-indigo-500' />
                <span className='text-sm font-semibold text-gray-800'>
                  {property.property_type_info.property_type_name}
                </span>
                {property.property_type_info.property_category_name && (
                  <>
                    <span className='text-gray-300'>·</span>
                    <span className='text-sm text-gray-500'>
                      {property.property_type_info.property_category_name}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Price range */}
            <PriceBadges property={property} listingType={listingType} />

            {/* Stats tiles */}
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {usableArea && (
                <InfoTile
                  label={t('detailPanel.usableArea')}
                  value={usableArea}
                  icon={<Ruler className='h-3 w-3' />}
                />
              )}
              {landArea && (
                <InfoTile
                  label={t('detailPanel.landArea')}
                  value={landArea}
                  icon={<Ruler className='h-3 w-3' />}
                />
              )}
              {bedroomsAttr?.value_number != null && (
                <InfoTile
                  label={t('detailPanel.bedrooms')}
                  value={String(bedroomsAttr.value_number)}
                  icon={<Home className='h-3 w-3' />}
                />
              )}
              {bathroomsAttr?.value_number != null && (
                <InfoTile
                  label={t('detailPanel.bathrooms')}
                  value={String(bathroomsAttr.value_number)}
                  icon={<Home className='h-3 w-3' />}
                />
              )}
              {floorsAttr?.value_number != null && (
                <InfoTile
                  label={t('detailPanel.floors')}
                  value={String(floorsAttr.value_number)}
                  icon={<Building2 className='h-3 w-3' />}
                />
              )}
            </div>

            {/* Description */}
            {property.descriptions && (
              <section>
                <h4 className='mb-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400'>
                  {t('detailPanel.description')}
                </h4>
                <p className='rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-600'>
                  {property.descriptions}
                </p>
              </section>
            )}

            <Separator className='bg-gray-100' />

            {/* Owner info */}
            <section>
              <h4 className='mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400'>
                {t('detailPanel.ownerInfo')}
              </h4>
              <div className='space-y-3'>
                {property.owner_name && (
                  <div className='flex items-center gap-3'>
                    <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50'>
                      <User className='h-4 w-4 text-indigo-500' />
                    </div>
                    <div>
                      <div className='text-[10px] font-medium uppercase tracking-wide text-gray-400'>
                        {t('detailPanel.ownerName')}
                      </div>
                      <div className='text-sm font-semibold text-gray-800'>
                        {property.owner_name}
                      </div>
                    </div>
                  </div>
                )}
                {property.owner_phone && (
                  <div className='flex items-center gap-3'>
                    <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-50'>
                      <Phone className='h-4 w-4 text-green-500' />
                    </div>
                    <div>
                      <div className='text-[10px] font-medium uppercase tracking-wide text-gray-400'>
                        {t('detailPanel.phone')}
                      </div>
                      <div className='text-sm font-semibold text-gray-800'>
                        {property.owner_phone}
                      </div>
                    </div>
                  </div>
                )}
                {property.owner_email && (
                  <div className='flex items-center gap-3'>
                    <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-50'>
                      <Mail className='h-4 w-4 text-orange-500' />
                    </div>
                    <div>
                      <div className='text-[10px] font-medium uppercase tracking-wide text-gray-400'>
                        {t('detailPanel.email')}
                      </div>
                      <div className='truncate text-sm font-semibold text-gray-800'>
                        {property.owner_email}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Sticky CTA footer */}
        <div className='flex-shrink-0 border-t border-gray-100 bg-white p-4'>
          {property.has_active_proposal ? (
            <div className='flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700'>
              <CheckCircle2 className='h-4 w-4' />
              {t('detailPanel.alreadyProposed')}
            </div>
          ) : (
            <Button
              className='h-11 w-full gap-2 rounded-xl bg-main-primary text-sm font-semibold text-white shadow-sm shadow-indigo-200/60 hover:bg-main-primary/90'
              onClick={() => setProposalModalOpen(true)}
            >
              <SendHorizonal className='h-4 w-4' />
              {t('detailPanel.submitProposal')}
            </Button>
          )}
        </div>
      </div>

      <SubmitProposalModal
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
        property={property}
        onSubmit={handleProposalSubmit}
        isLoading={submitProposalMutation.isPending}
      />
    </>
  );
}
