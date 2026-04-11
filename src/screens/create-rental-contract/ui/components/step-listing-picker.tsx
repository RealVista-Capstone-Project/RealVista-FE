'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Bath,
  BedDouble,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Input } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { propertyQueries } from '@/entities/property/api/property.queries';
import type { PropertySummaryResponse } from '@/entities/property/api/property-api.types';
import { ListingMetaChip } from './shared';

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getPropertyThumbnail(property: PropertySummaryResponse): string | null {
  const standardMedia = (property.media ?? []).filter((m) => m.is_property_standard);
  const primary =
    standardMedia.find((m) => m.is_primary) ?? standardMedia[0] ?? property.media?.[0];
  return primary?.thumbnail_url ?? primary?.media_url ?? null;
}

export function getPropertyAddress(property: PropertySummaryResponse): string {
  const parts = [
    property.street_address,
    property.location_info?.ward_name,
    property.location_info?.district_name,
    property.location_info?.city_name,
  ].filter(Boolean);
  return parts.join(', ');
}

export function getAttributeNumber(property: PropertySummaryResponse, code: string): number {
  const attr = (property.attributes ?? []).find((a) => a.attribute_code === code);
  return attr?.value_number ?? 0;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 6;

// ── Props ──────────────────────────────────────────────────────────────────────

interface StepListingPickerProps {
  selectedPropertyId: string;
  onSelectProperty: (property: PropertySummaryResponse) => void;
  t: (key: string, values?: Record<string, unknown>) => string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function StepListingPicker({
  selectedPropertyId,
  onSelectProperty,
  t,
}: StepListingPickerProps) {
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1); // 1-based UI page

  // Debounce search so we don't fire on every keystroke
  const debouncedSearch = useDebounce(searchInput, 400);

  // Reset to page 1 whenever the search term changes
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  // Query: uses propertyApi.getMyProperties → GET /api/v1/properties/me
  const { data, isLoading, isFetching } = useQuery(
    propertyQueries.myProperties({
      keyword: debouncedSearch || undefined,
      page: page - 1, // API is 0-based
      size: ITEMS_PER_PAGE,
    })
  );

  const pageData = data?.payload?.data;
  const properties: PropertySummaryResponse[] = pageData?.content ?? [];

  // Handle both snake_case (total_pages) and camelCase (totalPages) responses
  const totalPages = pageData?.total_pages ?? pageData?.totalPages ?? 0;

  const loading = isLoading || isFetching;

  return (
    <div className='space-y-4'>
      {/* Search header */}
      <div className='rounded-3xl border border-[#E9E0FF] bg-[#FBF9FF] p-4'>
        <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-main-primary/70'>
              {t('listingPicker.eyebrow')}
            </p>
            <h3 className='mt-2 text-lg font-semibold text-main-black'>
              {t('listingPicker.title')}
            </h3>
            <p className='mt-1 text-sm leading-6 text-main-secondary/65'>
              {t('listingPicker.description')}
            </p>
          </div>
          <div className='relative w-full md:max-w-xs'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-main-secondary/45' />
            <Input
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('listingPicker.searchPlaceholder')}
              className='h-11 rounded-2xl border-[#E5DFFC] bg-white pl-9'
            />
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className='flex items-center justify-center rounded-3xl border border-dashed border-[#DDD2FF] bg-[#FBF9FF] px-5 py-16'>
          <Loader2 className='h-6 w-6 animate-spin text-main-primary/60' />
        </div>
      )}

      {/* Property cards */}
      {!loading && (
        <>
          <div className='grid gap-4'>
            {properties.map((property) => {
              const isSelected = property.property_id === selectedPropertyId;
              const thumbnail = getPropertyThumbnail(property);
              const address = getPropertyAddress(property);
              const bedrooms = getAttributeNumber(property, 'bedrooms');
              const bathrooms = getAttributeNumber(property, 'bathrooms');
              const typeName = property.property_type_info?.property_type_name ?? '';

              return (
                <button
                  key={property.property_id}
                  type='button'
                  onClick={() => onSelectProperty(property)}
                  className={cn(
                    'overflow-hidden rounded-3xl border bg-white text-left transition-all',
                    isSelected
                      ? 'border-main-primary shadow-[0_22px_50px_rgba(92,63,214,0.18)]'
                      : 'border-[#ECE4FF] shadow-[0_14px_32px_rgba(96,72,179,0.08)] hover:-translate-y-0.5 hover:border-[#D8C8FF]'
                  )}
                >
                  <div className='grid gap-0 md:grid-cols-[220px_1fr]'>
                    {/* Thumbnail */}
                    <div className='relative min-h-[180px] bg-[#F4EEFF]'>
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={property.street_address}
                          fill
                          className='object-cover'
                        />
                      ) : (
                        <div className='flex h-full items-center justify-center text-main-secondary/30'>
                          <Building2 className='h-12 w-12' />
                        </div>
                      )}
                      <div className='absolute left-4 top-4'>
                        <Badge className='rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold text-main-black shadow-sm'>
                          {property.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Details */}
                    <div className='flex flex-col justify-between p-5'>
                      <div>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                          <div>
                            <h4 className='mt-2 text-xl font-semibold tracking-[-0.03em] text-main-black'>
                              {property.street_address}
                            </h4>
                          </div>
                        </div>

                        <div className='mt-4 flex items-start gap-2 text-sm text-main-secondary/72'>
                          <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-main-primary/70' />
                          <span>{address}</span>
                        </div>

                        <div className='mt-4 flex flex-wrap gap-2'>
                          {typeName && <ListingMetaChip icon={Building2} value={typeName} />}
                          {bedrooms > 0 && (
                            <ListingMetaChip
                              icon={BedDouble}
                              value={t('listingPicker.bedroomsValue', { count: bedrooms })}
                            />
                          )}
                          {bathrooms > 0 && (
                            <ListingMetaChip
                              icon={Bath}
                              value={t('listingPicker.bathroomsValue', { count: bathrooms })}
                            />
                          )}
                        </div>
                      </div>

                      <div className='mt-5 flex items-center justify-end border-t border-[#F1EBFF] pt-4'>
                        <span
                          className={cn(
                            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]',
                            isSelected
                              ? 'bg-main-primary text-white'
                              : 'bg-[#F3EEFF] text-main-primary'
                          )}
                        >
                          {isSelected && <Check className='h-3.5 w-3.5' />}
                          {isSelected
                            ? t('listingPicker.selected')
                            : t('listingPicker.selectAction')}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Empty state */}
            {properties.length === 0 && (
              <div className='rounded-3xl border border-dashed border-[#DDD2FF] bg-[#FBF9FF] px-5 py-10 text-center'>
                <Building2 className='mx-auto mb-3 h-10 w-10 text-main-secondary/25' />
                <p className='text-sm font-semibold text-main-black'>
                  {t('listingPicker.emptyTitle')}
                </p>
                <p className='mt-2 text-sm leading-6 text-main-secondary/65'>
                  {t('listingPicker.emptyDescription')}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                className='h-9 w-9 rounded-xl border-[#DED1FF] p-0'
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <span className='text-sm text-main-secondary/70'>
                {page} / {totalPages}
              </span>
              <Button
                type='button'
                variant='outline'
                className='h-9 w-9 rounded-xl border-[#DED1FF] p-0'
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
