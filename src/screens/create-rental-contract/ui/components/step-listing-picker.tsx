'use client';

import { useState, useEffect } from 'react';
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
import { Button, Input } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { propertyQueries } from '@/entities/property/api/property.queries';
import type { PropertySummaryResponse } from '@/entities/property/api/property-api.types';

function useItemsPerPage(): number {
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    function calculate() {
      const viewportHeight = window.innerHeight;
      const overhead = 620;
      const available = viewportHeight - overhead;
      const cardHeight = 124;
      const count = Math.max(2, Math.floor(available / cardHeight));
      setItemsPerPage(count);
    }

    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, []);

  return itemsPerPage;
}

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
  const [page, setPage] = useState(1);
  const itemsPerPage = useItemsPerPage();

  useEffect(() => {
    setPage(1);
  }, [itemsPerPage]);

  const debouncedSearch = useDebounce(searchInput, 400);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const { data, isLoading, isFetching } = useQuery(
    propertyQueries.myProperties({
      keyword: debouncedSearch || undefined,
      status: 'AVAILABLE',
      page: page - 1,
      size: itemsPerPage,
    })
  );

  const pageData = data?.payload?.data;
  const properties: PropertySummaryResponse[] = pageData?.content ?? [];
  const totalPages = pageData?.total_pages ?? pageData?.totalPages ?? 0;
  const loading = isLoading || isFetching;

  return (
    <div className='rounded-xl border-[1.5px] border-primary/20 p-4 md:p-6'>
      {/* Section header — title + search input */}
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <h3 className='text-lg font-bold leading-snug tracking-tight text-foreground'>
          {t('listingPicker.title')}
        </h3>
        <div className='relative w-full sm:max-w-[260px]'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60' />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('listingPicker.searchPlaceholder')}
            className='h-10 rounded-xl border-[1.5px] border-primary/25 bg-white pl-9 placeholder:text-muted-foreground/40'
          />
        </div>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className='flex justify-center py-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </div>
      )}

      {/* Property list */}
      {!loading && (
        <>
          <div className='flex flex-col gap-3'>
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
                    'group relative flex w-full items-start gap-4 rounded-xl border-[1.5px] p-4 text-left transition-all duration-200',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-[0px_0px_20px_0px_color-mix(in_oklch,var(--primary)_15%,transparent)]'
                      : 'border-primary/20 bg-white hover:border-primary/40 hover:bg-primary/5'
                  )}
                >
                  {/* Thumbnail */}
                  <div className='relative h-[80px] w-[112px] shrink-0 overflow-hidden rounded-lg'>
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={property.street_address}
                        fill
                        className='object-cover'
                        sizes='112px'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center bg-primary/5'>
                        <Building2 className='h-6 w-6 text-muted-foreground/60' />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
                    <div className='flex items-center gap-2'>
                      <span className='truncate text-sm font-bold leading-tight text-foreground'>
                        {property.street_address}
                      </span>
                      <span className='shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary/80'>
                        {t(`listingPicker.status.${property.status}`)}
                      </span>
                    </div>

                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <MapPin className='h-3 w-3 shrink-0' />
                      <span className='truncate'>{address}</span>
                    </div>

                    <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                      {typeName && (
                        <span className='flex items-center gap-1'>
                          <Building2 className='h-3 w-3' />
                          {typeName}
                        </span>
                      )}
                      {bedrooms > 0 && (
                        <span className='flex items-center gap-1'>
                          <BedDouble className='h-3 w-3' />
                          {t('listingPicker.bedroomsValue', { count: bedrooms })}
                        </span>
                      )}
                      {bathrooms > 0 && (
                        <span className='flex items-center gap-1'>
                          <Bath className='h-3 w-3' />
                          {t('listingPicker.bathroomsValue', { count: bathrooms })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Radio selection indicator */}
                  <div
                    className={cn(
                      'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-primary/20 bg-white group-hover:border-primary/40'
                    )}
                  >
                    {isSelected && <Check className='h-3 w-3 text-white' strokeWidth={3} />}
                  </div>
                </button>
              );
            })}

            {/* Empty state */}
            {properties.length === 0 && (
              <div className='flex justify-center py-8'>
                <span className='text-sm text-muted-foreground/70'>
                  {t('listingPicker.emptyTitle')}
                </span>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-6 flex items-center justify-center gap-2'>
              <Button
                type='button'
                variant='outline'
                className='h-9 w-9 rounded-xl border-primary/30 p-0'
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <span className='text-sm text-muted-foreground'>
                {page} / {totalPages}
              </span>
              <Button
                type='button'
                variant='outline'
                className='h-9 w-9 rounded-xl border-primary/30 p-0'
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
