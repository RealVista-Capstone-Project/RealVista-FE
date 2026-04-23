'use client';

import type { OwnerPropertySummary } from '@/entities/property';
import type { ListingType } from '@/features/agent-proposal/model/property-feed-context';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { MapPin, Ruler, Home, BedDouble, CheckCircle2, SendHorizonal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatVND } from '@/shared/lib/utils/format-currency';

interface OwnerPropertyCardProps {
  property: OwnerPropertySummary;
  isSelected?: boolean;
  onClick?: (property: OwnerPropertySummary) => void;
  onPropose?: (property: OwnerPropertySummary) => void;
  variant?: 'sidebar' | 'card' | 'grid';
  listingType?: ListingType;
  isAgent?: boolean;
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

function formatRentPrice(priceRange: OwnerPropertySummary['price_range']): string | null {
  if (!priceRange?.rent) return null;
  const { min, max } = priceRange.rent;
  if (min && max) return `${formatVND(min)} – ${formatVND(max)}`;
  if (min) return `${formatVND(min)}+`;
  if (max) return `≤ ${formatVND(max)}`;
  return null;
}

function formatBuyPrice(priceRange: OwnerPropertySummary['price_range']): string | null {
  if (!priceRange?.buy) return null;
  const { min, max } = priceRange.buy;
  if (min && max) return `${formatVND(min)} – ${formatVND(max)}`;
  if (min) return `${formatVND(min)}+`;
  if (max) return `≤ ${formatVND(max)}`;
  return null;
}

/** Grid card variant — full-width image on top, CTA at bottom */
function GridCard({
  property,
  onPropose,
  isSelected,
  listingType = 'ALL',
  isAgent,
}: {
  property: OwnerPropertySummary;
  onPropose?: (property: OwnerPropertySummary) => void;
  isSelected?: boolean;
  listingType?: ListingType;
  isAgent?: boolean;
}) {
  const t = useTranslations('PropertyFeed');

  const thumbnailUrl =
    property.media?.find((m) => m.is_primary)?.media_url ?? property.media?.[0]?.media_url;

  const location = [property.location_info?.district_name, property.location_info?.city_name]
    .filter(Boolean)
    .join(', ');

  const area = formatArea(property.usable_size_m2 ?? property.land_size_m2);
  const bedroomsAttr = property.attributes?.find((a) => a.attribute_code === 'BEDROOMS');
  const rentPriceDisplay = formatRentPrice(property.price_range);
  const buyPriceDisplay = formatBuyPrice(property.price_range);

  const showRent = listingType === 'RENT' || (listingType === 'ALL' && !!rentPriceDisplay);
  const showBuy = listingType === 'SELL' || (listingType === 'ALL' && !!buyPriceDisplay);

  const alreadyProposed = property.has_active_proposal;

  return (
    <div
      className={cn(
        'group flex flex-col rounded-2xl border bg-white overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        isSelected
          ? 'border-primary shadow-md ring-2 ring-primary/20'
          : 'border-border shadow-sm hover:border-primary/30'
      )}
    >
      {/* Image */}
      <div className='relative h-44 w-full flex-shrink-0 bg-muted overflow-hidden'>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={property.street_address}
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10'>
            <Home className='h-10 w-10 text-primary/30' />
          </div>
        )}

        {/* Gradient overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent' />

        {/* Status badge — top left */}
        <div className='absolute top-2.5 left-2.5'>
          <Badge
            variant='outline'
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/90 backdrop-blur-sm',
              getStatusStyle(property.status)
            )}
          >
            {property.status}
          </Badge>
        </div>

        {/* Already proposed badge — top right */}
        {alreadyProposed && (
          <div className='absolute top-2.5 right-2.5'>
            <span className='flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full'>
              <CheckCircle2 className='h-3 w-3' />
              {t('card.proposed')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className='flex flex-1 flex-col p-4 gap-3'>
        {/* Address + type */}
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <h3 className='font-bold text-foreground text-sm leading-snug line-clamp-1'>
              {property.street_address}
            </h3>
            {location && (
              <div className='flex items-center gap-1 mt-0.5'>
                <MapPin className='h-3 w-3 text-muted-foreground/50 flex-shrink-0' />
                <span className='text-xs text-muted-foreground truncate'>{location}</span>
              </div>
            )}
          </div>
          {property.property_type_info?.property_type_name && (
            <span className='flex-shrink-0 text-[11px] font-semibold bg-primary/5 text-primary px-2 py-0.5 rounded-lg border border-primary/10'>
              {property.property_type_info.property_type_name}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className='flex items-center gap-3 text-xs text-muted-foreground'>
          {area && (
            <div className='flex items-center gap-1'>
              <Ruler className='h-3.5 w-3.5 text-muted-foreground/50' />
              <span className='font-medium'>{area}</span>
            </div>
          )}
          {bedroomsAttr?.value_number != null && (
            <div className='flex items-center gap-1'>
              <BedDouble className='h-3.5 w-3.5 text-muted-foreground/50' />
              <span className='font-medium'>
                {bedroomsAttr.value_number} {t('card.bedrooms')}
              </span>
            </div>
          )}
        </div>

        {/* Price badges */}
        {(showRent && rentPriceDisplay) || (showBuy && buyPriceDisplay) ? (
          <div className='flex flex-wrap gap-1.5'>
            {showRent && rentPriceDisplay && (
              <span className='text-[11px] font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-200 whitespace-nowrap'>
                {t('card.rent')}: {rentPriceDisplay}
              </span>
            )}
            {showBuy && buyPriceDisplay && (
              <span className='text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 whitespace-nowrap'>
                {t('card.buy')}: {buyPriceDisplay}
              </span>
            )}
          </div>
        ) : null}

        {/* Spacer */}
        <div className='flex-1' />

        {/* CTA button — only shown for agents */}
        {isAgent && (
          <div className='pt-1 border-t border-border'>
            {alreadyProposed ? (
              <div className='flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700'>
                <CheckCircle2 className='h-3.5 w-3.5' />
                {t('card.alreadyProposed')}
              </div>
            ) : (
              <Button
                size='sm'
                className='w-full h-9 rounded-xl gap-1.5 text-xs font-semibold'
                onClick={(e) => {
                  e.stopPropagation();
                  onPropose?.(property);
                }}
              >
                <SendHorizonal className='h-3.5 w-3.5' />
                {t('card.submitProposal')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function OwnerPropertyCard({
  property,
  isSelected,
  onClick,
  onPropose,
  variant = 'sidebar',
  listingType = 'ALL',
  isAgent,
}: OwnerPropertyCardProps) {
  const t = useTranslations('PropertyFeed');

  // Grid variant — new full design
  if (variant === 'grid') {
    return (
      <div onClick={() => onClick?.(property)}>
        <GridCard
          property={property}
          onPropose={onPropose}
          isSelected={isSelected}
          listingType={listingType}
          isAgent={isAgent}
        />
      </div>
    );
  }

  // Sidebar / legacy card variant (unchanged)
  const thumbnailUrl =
    property.media?.find((m) => m.is_primary)?.media_url ?? property.media?.[0]?.media_url;

  const location = [property.location_info?.district_name, property.location_info?.city_name]
    .filter(Boolean)
    .join(', ');

  const area = formatArea(property.usable_size_m2 ?? property.land_size_m2);
  const bedroomsAttr = property.attributes?.find((a) => a.attribute_code === 'BEDROOMS');
  const rentPriceDisplay = formatRentPrice(property.price_range);
  const buyPriceDisplay = formatBuyPrice(property.price_range);

  const showRent = listingType === 'RENT' || (listingType === 'ALL' && !!rentPriceDisplay);
  const showBuy = listingType === 'SELL' || (listingType === 'ALL' && !!buyPriceDisplay);

  return (
    <button
      type='button'
      onClick={() => onClick?.(property)}
      className={cn(
        'group w-full text-left transition-all duration-200',
        variant === 'sidebar'
          ? cn(
              'relative flex flex-row items-stretch gap-0 px-4 py-3 sm:px-5 sm:py-4 transition-all duration-200',
              'after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1',
              isSelected
                ? cn('bg-primary/10 border-l-4 border-l-primary', 'after:bg-primary')
                : 'bg-white hover:bg-primary/5 after:w-0'
            )
          : cn(
              'flex flex-row items-stretch gap-0 rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5',
              isSelected
                ? 'border-primary shadow-md ring-2 ring-primary/20'
                : 'border-border shadow-sm hover:border-primary/40'
            )
      )}
    >
      {/* Thumbnail */}
      <div className='relative w-40 h-32 flex-shrink-0 bg-muted overflow-hidden'>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={property.street_address}
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/5'>
            <Home className='h-8 w-8 text-primary/50' />
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
            {property.status}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0 flex flex-col justify-between px-4 py-3 gap-2'>
        <div className={cn('flex items-start justify-between gap-2', isSelected && 'text-primary')}>
          <div className='min-w-0 flex-1'>
            <h3 className='font-bold text-foreground text-sm leading-snug line-clamp-1'>
              {property.street_address}
            </h3>
            {location && (
              <div className='flex items-center gap-1 mt-0.5'>
                <MapPin className='h-3 w-3 text-muted-foreground/50 flex-shrink-0' />
                <span
                  className={cn(
                    'text-xs truncate',
                    isSelected ? 'text-primary/80' : 'text-muted-foreground'
                  )}
                >
                  {location}
                </span>
              </div>
            )}
          </div>
          <div className='flex items-center gap-1.5 flex-shrink-0'>
            {property.property_type_info?.property_type_name && (
              <span className='text-[11px] font-semibold bg-primary/5 text-primary px-2.5 py-0.5 rounded-lg border border-primary/10'>
                {property.property_type_info.property_type_name}
              </span>
            )}
            {property.has_active_proposal && (
              <span className='flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-200'>
                <CheckCircle2 className='h-3 w-3' />
                {t('card.proposed')}
              </span>
            )}
          </div>
        </div>

        {property.descriptions && (
          <p className='text-xs text-muted-foreground leading-relaxed line-clamp-2'>
            {property.descriptions}
          </p>
        )}

        <div className='flex items-end justify-between gap-3 pt-1.5 border-t border-border'>
          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
            {area && (
              <div className='flex items-center gap-1'>
                <Ruler className='h-3.5 w-3.5 text-gray-400' />
                <span className='font-medium'>{area}</span>
              </div>
            )}
            {bedroomsAttr?.value_number != null && (
              <div className='flex items-center gap-1'>
                <BedDouble className='h-3.5 w-3.5 text-gray-400' />
                <span className='font-medium'>
                  {bedroomsAttr.value_number} {t('card.bedrooms')}
                </span>
              </div>
            )}
          </div>
          <div className='flex flex-col items-end gap-1 flex-shrink-0'>
            {showRent && rentPriceDisplay && (
              <span className='text-[11px] font-bold bg-green-50 text-green-700 px-2.5 py-0.5 rounded-md border border-green-200 whitespace-nowrap'>
                {t('card.rent')}: {rentPriceDisplay}
              </span>
            )}
            {showBuy && buyPriceDisplay && (
              <span className='text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200 whitespace-nowrap'>
                {t('card.buy')}: {buyPriceDisplay}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
