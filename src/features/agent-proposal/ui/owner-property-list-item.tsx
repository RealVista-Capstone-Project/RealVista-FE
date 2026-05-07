'use client';

import type { OwnerPropertySummary } from '@/entities/property';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { MapPin, ChevronRight, Home, Ruler } from 'lucide-react';
import { useTranslations, useMessages } from 'next-intl';

interface OwnerPropertyListItemProps {
  property: OwnerPropertySummary;
  isSelected: boolean;
  onClick: (property: OwnerPropertySummary) => void;
}

function getPropertyStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-700';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700';
    case 'VERIFIED':
      return 'bg-blue-100 text-blue-700';
    case 'DRAFT':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function formatArea(size: number | null): string {
  if (!size) return '—';
  return `${size} m²`;
}

export function OwnerPropertyListItem({
  property,
  isSelected,
  onClick,
}: OwnerPropertyListItemProps) {
  const t = useTranslations('PropertyFeed');
  const messages = useMessages() as any;

  const location = [
    property.location_info?.ward_name,
    property.location_info?.district_name,
    property.location_info?.city_name,
  ]
    .filter(Boolean)
    .join(', ');

  const thumbnailUrl = property.media?.find((m) => m.is_primary)?.media_url
    ?? property.media?.[0]?.media_url;

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-4 px-5 py-3.5 items-center cursor-pointer transition-all duration-150 group relative border-l-[3px]',
        isSelected
          ? 'bg-indigo-50/70 border-l-primary'
          : 'bg-white border-l-transparent hover:bg-gray-50/80 hover:border-l-gray-200'
      )}
      onClick={() => onClick(property)}
    >
      {/* Thumbnail */}
      <div className='col-span-1'>
        <div className='h-10 w-10 rounded-xl overflow-hidden bg-indigo-50 flex-shrink-0 flex items-center justify-center'>
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={property.street_address}
              className='h-full w-full object-cover'
            />
          ) : (
            <Home className='h-5 w-5 text-indigo-300' />
          )}
        </div>
      </div>

      {/* Address */}
      <div className='col-span-4 min-w-0'>
        <div className='font-semibold text-gray-900 truncate text-sm leading-tight'>
          {property.street_address}
        </div>
        {location && (
          <div className='flex items-center gap-1 mt-0.5'>
            <MapPin className='h-3 w-3 text-gray-300 flex-shrink-0' />
            <span className='text-xs text-gray-400 truncate'>{location}</span>
          </div>
        )}
      </div>

      {/* Property Type */}
      <div className='col-span-3 min-w-0'>
        <div className='text-sm text-gray-700 font-medium truncate'>
          {property.property_type_info?.property_type_name ?? t('common.na')}
        </div>
        <div className='text-xs text-gray-400 mt-0.5'>
          {property.property_type_info?.property_category_name ?? ''}
        </div>
      </div>

      {/* Area */}
      <div className='col-span-2'>
        <div className='flex items-center gap-1.5 text-sm text-gray-700 font-medium'>
          <Ruler className='h-3.5 w-3.5 text-gray-400' />
          {formatArea(property.usable_size_m2 ?? property.land_size_m2)}
        </div>
      </div>

      {/* Status + Arrow */}
      <div className='col-span-2 flex items-center justify-between'>
        <Badge
          variant='secondary'
          className={cn(
            'text-[10px] h-5 px-2 font-semibold pointer-events-none rounded-full',
            getPropertyStatusColor(property.status)
          )}
        >
          {(() => {
            const status = (property.status || '').toLowerCase().trim();
            if (!status) return property.status;

            const fallbackMap: Record<string, string> = {
              available: 'Sẵn sàng',
              pending: 'Đang chờ',
              verified: 'Đã xác thực',
              rejected: 'Đã từ chối',
              sold: 'Đã bán',
              rented: 'Đã cho thuê',
            };

            try {
              const statusObj = messages?.PropertyFeed?.status;
              if (statusObj && typeof statusObj === 'object') {
                const val = (statusObj as any)[status] || (statusObj as any)[status.toUpperCase()];
                if (val && typeof val === 'string') return val;
              }
            } catch (e) {}

            try {
              const commonStatusObj = messages?.Common?.Status;
              if (commonStatusObj && typeof commonStatusObj === 'object') {
                const val = (commonStatusObj as any)[status] || (commonStatusObj as any)[status.toUpperCase()];
                if (val && typeof val === 'string') return val;
              }
            } catch (e) {}

            return fallbackMap[status] || property.status;
          })()}
        </Badge>
        <ChevronRight
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-all duration-150',
            isSelected
              ? 'text-primary'
              : 'text-gray-200 group-hover:text-gray-400'
          )}
        />
      </div>
    </div>
  );
}
