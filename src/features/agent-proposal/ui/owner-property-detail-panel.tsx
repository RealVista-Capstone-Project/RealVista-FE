'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { OwnerPropertySummary, PropertyMediaItem } from '@/entities/property';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
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
import { AgentApplyProposalModal } from './agent-apply-proposal-modal';
import { useAgentProposalCtaForOwnerProperty } from '../hooks/use-agent-proposal-cta-for-owner-property';
import { usePropertyFeedContext, type ListingType } from '../model/property-feed-context';

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
      return 'bg-muted text-muted-foreground border-border';
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

function isUsableImageUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.trim() !== '' && url !== 'null';
}

/** Prefer a real image URL; primary VIDEO / tour uses thumbnail, not media_url. */
function getOwnerPropertyHeroImageUrl(media: PropertyMediaItem[] | null): string | null {
  if (!media?.length) return null;

  const urlForItem = (m: PropertyMediaItem): string | null => {
    const type = (m.media_type || '').toUpperCase();
    if (type === 'IMAGE') {
      return isUsableImageUrl(m.media_url) ? m.media_url : null;
    }
    if (type === 'VIDEO' || type === 'VIRTUAL_TOUR' || type === 'THREE_D') {
      return isUsableImageUrl(m.thumbnail_url) ? m.thumbnail_url : null;
    }
    if (type === 'DOCUMENT') return null;
    return isUsableImageUrl(m.media_url) ? m.media_url : null;
  };

  const tryItems = (items: PropertyMediaItem[]) => {
    for (const m of items) {
      const u = urlForItem(m);
      if (u) return u;
    }
    return null;
  };

  const fromPrimary = tryItems(media.filter((m) => m.is_primary));
  if (fromPrimary) return fromPrimary;
  return tryItems(media);
}

function PriceBadges({
  property,
  listingType,
}: {
  property: OwnerPropertySummary;
  listingType: ListingType;
}) {
  const t = useTranslations('PropertyFeed');
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

function InfoTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className='bg-muted rounded-xl p-3 border border-border flex flex-col gap-1.5'>
      <div className='flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wide'>
        {icon}
        {label}
      </div>
      <div className='font-bold text-foreground text-sm truncate'>{value}</div>
    </div>
  );
}

/**
 * Inline detail panel — renders directly inside the right-side main area
 * (used by the two-panel layout in PropertyFeedPage).
 */
export function OwnerPropertyDetailPanel({ property, onBack }: OwnerPropertyDetailPanelProps) {
  const t = useTranslations('PropertyFeed');
  const { listingType } = usePropertyFeedContext();
  const {
    isAgent,
    isApplyModalOpen,
    setIsApplyModalOpen,
    cannotApplyProposal,
    openApplyModal,
    onApplySubmitSuccess,
    propertyId,
  } = useAgentProposalCtaForOwnerProperty(property);

  const heroImageUrl = getOwnerPropertyHeroImageUrl(property.media);
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    setHeroImageError(false);
  }, [property.property_id, heroImageUrl]);

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
          <div className='sticky top-0 z-20 flex items-center border-b border-primary/20 bg-white px-4 py-3 sm:hidden'>
            <button
              onClick={onBack}
              className='flex items-center gap-2 text-sm font-semibold text-foreground'
            >
              <ArrowLeft className='h-5 w-5' strokeWidth={2.5} />
              <span>{t('detailPanel.backToList')}</span>
            </button>
          </div>
        )}

        {/* Hero image */}
        <div className='relative h-56 w-full flex-shrink-0 bg-muted'>
          {heroImageUrl && !heroImageError ? (
            <Image
              src={heroImageUrl}
              alt={property.street_address}
              fill
              className='object-cover'
              sizes='(max-width: 640px) 100vw, min(720px, 55vw)'
              priority
              onError={() => setHeroImageError(true)}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-primary/5'>
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
                <Building2 className='h-4 w-4 flex-shrink-0 text-primary' />
                <span className='text-sm font-semibold text-foreground/80'>
                  {property.property_type_info.property_type_name}
                </span>
                {property.property_type_info.property_category_name && (
                  <>
                    <span className='text-muted-foreground/30'>·</span>
                    <span className='text-sm text-muted-foreground'>
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
                <h4 className='mb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50'>
                  {t('detailPanel.description')}
                </h4>
                <p className='rounded-xl border border-border bg-muted p-4 text-sm leading-relaxed text-muted-foreground'>
                  {property.descriptions}
                </p>
              </section>
            )}

            <Separator className='bg-border' />

            {/* Owner info */}
            <section>
              <h4 className='mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50'>
                {t('detailPanel.ownerInfo')}
              </h4>
              <div className='space-y-3'>
                {property.owner_name && (
                  <div className='flex items-center gap-3'>
                    <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/5'>
                      <User className='h-4 w-4 text-primary' />
                    </div>
                    <div>
                      <div className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground/50'>
                        {t('detailPanel.ownerName')}
                      </div>
                      <div className='text-sm font-semibold text-foreground/80'>
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
                      <div className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground/50'>
                        {t('detailPanel.phone')}
                      </div>
                      <div className='text-sm font-semibold text-foreground/80'>
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
                      <div className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground/50'>
                        {t('detailPanel.email')}
                      </div>
                      <div className='truncate text-sm font-semibold text-foreground/80'>
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
        {isAgent && (
          <div className='flex-shrink-0 border-t border-border bg-white p-4'>
            {cannotApplyProposal ? (
              <div className='flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700'>
                <CheckCircle2 className='h-4 w-4' />
                {t('detailPanel.alreadyProposed')}
              </div>
            ) : (
              <Button
                className='h-11 w-full gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-primary/20 hover:bg-primary/90'
                onClick={openApplyModal}
              >
                <SendHorizonal className='h-4 w-4' />
                {t('detailPanel.submitProposal')}
              </Button>
            )}
          </div>
        )}
      </div>

      {isAgent && propertyId && (
        <AgentApplyProposalModal
          propertyId={propertyId}
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onSubmitSuccess={onApplySubmitSuccess}
        />
      )}
    </>
  );
}
