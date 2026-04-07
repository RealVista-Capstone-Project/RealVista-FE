'use client';

import type { OwnerPropertySummary } from '@/entities/property';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { MapPin, Ruler, Home, User, BedDouble, Building2, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OwnerPropertyCardProps {
  property: OwnerPropertySummary;
  isSelected: boolean;
  onClick: (property: OwnerPropertySummary) => void;
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

export function OwnerPropertyCard({
  property,
  isSelected,
  onClick,
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

  return (
    <button
      type='button'
      onClick={() => onClick(property)}
      className={cn(
        'group w-full text-left bg-white rounded-2xl border transition-all duration-200 overflow-hidden',
        'flex flex-row items-stretch gap-0',
        'hover:shadow-md hover:-translate-y-0.5',
        isSelected
          ? 'border-main-primary shadow-md ring-2 ring-main-primary/20'
          : 'border-gray-200 shadow-sm hover:border-main-primary/40'
      )}
    >
      {/* Thumbnail — fixed width + height left column */}
      <div className='relative w-44 h-36 flex-shrink-0 bg-gray-100 overflow-hidden'>
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
      </div>

      {/* Content — flexible right column */}
      <div className='flex-1 min-w-0 flex flex-col justify-between px-5 py-4 gap-3'>
        {/* Top: address + type */}
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <h3 className='font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-main-primary transition-colors'>
              {property.street_address}
            </h3>
            {location && (
              <div className='flex items-center gap-1 mt-1'>
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

        {/* Middle: description */}
        {property.description && (
          <p className='text-xs text-gray-500 leading-relaxed line-clamp-2'>
            {property.description}
          </p>
        )}

        {/* Bottom: stats + owner + arrow */}
        <div className='flex items-center justify-between gap-3 pt-2 border-t border-gray-100'>
          {/* Stats */}
          <div className='flex items-center gap-4 text-xs text-gray-500'>
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
            {property.property_type_info?.property_category_name && (
              <div className='flex items-center gap-1 hidden sm:flex'>
                <Building2 className='h-3.5 w-3.5 text-gray-400' />
                <span className='font-medium'>
                  {property.property_type_info.property_category_name}
                </span>
              </div>
            )}
          </div>

          {/* Owner + CTA */}
          <div className='flex items-center gap-3 flex-shrink-0'>
            <div className='hidden sm:flex items-center gap-1.5'>
              <div className='h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center'>
                <User className='h-2.5 w-2.5 text-indigo-500' />
              </div>
              <span className='text-xs font-medium text-gray-600 max-w-[120px] truncate'>
                {property.owner_name ?? t('common.na')}
              </span>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-semibold transition-colors',
                isSelected
                  ? 'text-main-primary'
                  : 'text-gray-400 group-hover:text-main-primary'
              )}
            >
              {t('card.viewDetails')}
              <ArrowRight className='h-3 w-3' />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
