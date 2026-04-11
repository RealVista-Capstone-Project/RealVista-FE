'use client';

import type { OwnerPropertySummary } from '@/entities/property';
import type { ListingType } from '@/features/agent-proposal/model/owner-properties-context';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { MapPin, Ruler, Home, BedDouble, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatVND } from '@/shared/lib/utils/format-currency';

interface OwnerPropertyCardProps {
  property: OwnerPropertySummary;
  isSelected: boolean;
  onClick: (property: OwnerPropertySummary) => void;
  variant?: 'sidebar' | 'card';
  listingType?: ListingType;
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

export function OwnerPropertyCard({
  property,
  isSelected,
  onClick,
  variant = 'sidebar',
  listingType = 'ALL',
}: OwnerPropertyCardProps) {
  const t = useTranslations('OwnerProperties');

  const thumbnailUrl =
    property.media?.find((m) => m.is_primary)?.media_url ??
    property.media?.[0]?.media_url;

  const location = [
    property.location_info?.district_name,
    property.location_info?.city_name,
  ]
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
      onClick={() => onClick(property)}
      className={cn(
        'group w-full text-left transition-all duration-200',
        variant === 'sidebar'
          ? cn(
              'flex flex-row items-stretch gap-0 px-4 py-3 sm:px-5 sm:py-4 hover:bg-purple-98',
              isSelected ? 'bg-purple-96' : 'bg-white'
            )
          : cn(
              'flex flex-row items-stretch gap-0 rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5',
              isSelected
                ? 'border-main-primary shadow-md ring-2 ring-main-primary/20'
                : 'border-gray-200 shadow-sm hover:border-main-primary/40'
            )
      )}
    >
      {/* Thumbnail */}
      <div className='relative w-40 h-32 flex-shrink-0 bg-gray-100 overflow-hidden'>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={property.street_address}
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50'>
            <Home className='h-8 w-8 text-indigo-300' />
          </div>
        )}
        {/* Status badge */}
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

        {/* Row 1: address + type badge + proposed chip */}
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
          <div className='flex items-center gap-1.5 flex-shrink-0'>
            {property.property_type_info?.property_type_name && (
              <span className='text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-100'>
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

        {/* Row 2: description */}
        {property.descriptions && (
          <p className='text-xs text-gray-500 leading-relaxed line-clamp-2'>
            {property.descriptions}
          </p>
        )}

        {/* Row 3: stats (left) + prices (right) */}
        <div className='flex items-end justify-between gap-3 pt-1.5 border-t border-gray-100'>
          {/* Stats */}
          <div className='flex items-center gap-3 text-xs text-gray-500'>
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

          {/* Prices — stacked vertically, right-aligned */}
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
