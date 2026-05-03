'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowUpDown, ArrowUpRight, Check, X } from 'lucide-react';
import type { ListingCompareData } from '@/entities/listing/model/types';
import { formatVND } from '@/shared/lib/utils/format-currency';

interface CompareListingsTableProps {
  listings: ListingCompareData[];
  locale: string;
  onOpenListing: (listing: ListingCompareData) => void;
}

type TabKey = 'overview' | 'details' | 'features';

function isEmptyValue(v: string | null | undefined): boolean {
  return v === null || v === undefined || v === '' || v === 'undefined';
}

function valuesDiffer(values: (string | null | undefined)[]): boolean {
  const nonNull = values.filter((v): v is string => !isEmptyValue(v));
  if (nonNull.length <= 1) return false;
  return new Set(nonNull).size > 1;
}

function displayValue(v: string | null | undefined): string {
  return isEmptyValue(v) ? '—' : v!;
}

export function CompareListingsTable({
  listings,
  onOpenListing,
}: CompareListingsTableProps) {
  const t = useTranslations('Compare');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showDiffOnly, setShowDiffOnly] = useState(false);

  const colCount = listings.length;

  // Helper to render a comparison row
  const Row = ({
    label,
    values,
    renderValue,
  }: {
    label: string;
    values: (string | null | undefined)[];
    renderValue?: (v: string | null | undefined, idx: number) => React.ReactNode;
  }) => {
    const hasDiff = valuesDiffer(values);
    if (showDiffOnly && !hasDiff) return null;
    return (
      <div className={`grid gap-4 border-b border-neutral-100 ${hasDiff && showDiffOnly ? 'bg-yellow-50/50' : ''}`} style={{ gridTemplateColumns: `200px repeat(${colCount}, 1fr)` }}>
        <div className="px-4 py-3 text-sm font-bold text-neutral-800">{label}</div>
        {values.map((v, i) => (
          <div key={i} className={`px-4 py-3 text-sm font-normal text-neutral-500 ${hasDiff ? 'text-foreground font-normal' : ''}`}>
            {renderValue ? renderValue(v, i) : displayValue(v)}
          </div>
        ))}
      </div>
    );
  };

  const formatDate = (d: string | null) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  };

  const formatPrice = (p: number | undefined) => (p ? formatVND(p) : '—');

  const allAmenityNames = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => l.amenities?.forEach((a) => set.add(a.amenity_name)));
    return [...set];
  }, [listings]);

  const allAttributeNames = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => l.attributes?.forEach((a) => set.add(a.attribute_name)));
    return [...set];
  }, [listings]);

  return (
    <div>
      {/* Tabs + Toggle */}
      <div className="mb-4 flex items-center justify-between border-b border-neutral-200">
        <div className="flex gap-6">
          {[
            { key: 'overview' as TabKey, label: t('tabOverview') },
            { key: 'details' as TabKey, label: t('tabDetails') },
            { key: 'features' as TabKey, label: t('tabFeatures') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowDiffOnly((v) => !v)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            showDiffOnly ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {t('showDifferences')}
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white">
        {/* Sticky header rows - always visible on all tabs */}
        <div className="sticky top-0 z-10 bg-white">
          {/* Row 1: Thumbnail + open detail */}
          <div className="grid gap-4 border-b border-neutral-100" style={{ gridTemplateColumns: `200px repeat(${colCount}, 1fr)` }}>
            <div className="px-4 py-3 text-sm font-bold text-neutral-800">{t('rowImage')}</div>
            {listings.map((listing) => (
              <div key={listing.listing_id} className="px-4 py-3">
                <div className="inline-flex items-center gap-2">
                  <div className="relative h-14 w-16 overflow-hidden rounded-md bg-neutral-100">
                    {listing.thumbnail_url ? (
                      <Image src={listing.thumbnail_url} alt={listing.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-400 text-xs">No image</div>
                    )}
                  </div>
                  <button
                    onClick={() => onOpenListing(listing)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title={t('viewDetail')}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Row 2: Address */}
          <div className="grid gap-4 border-b border-neutral-100" style={{ gridTemplateColumns: `200px repeat(${colCount}, 1fr)` }}>
            <div className="px-4 py-3 text-sm font-bold text-neutral-800">{t('rowAddress')}</div>
            {listings.map((listing) => (
              <div key={listing.listing_id} className="px-4 py-3 text-sm text-neutral-500">
                {listing.full_address || '—'}
              </div>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <Row label={t('rowPrice')} values={listings.map((l) => formatPrice(l.price))} />
            <Row label={t('rowListingType')} values={listings.map((l) => (l.listing_type === 'SALE' ? t('listingTypeSale') : t('listingTypeRent')))} />
            <Row label={t('rowPropertyType')} values={listings.map((l) => l.property_type?.property_type_name ?? null)} />
            <Row label={t('rowUsableArea')} values={listings.map((l) => (l.usable_size_m2 ? `${l.usable_size_m2} m²` : null))} />
            <Row label={t('rowLandSize')} values={listings.map((l) => (l.land_size_m2 ? `${l.land_size_m2} m²` : null))} />
            <Row label={t('rowNegotiable')} values={listings.map((l) => (l.is_negotiable ? t('yes') : t('no')))} />
            <Row label={t('rowPublished')} values={listings.map((l) => formatDate(l.published_at))} />
            <Row label={t('rowAvailable')} values={listings.map((l) => formatDate(l.available_from))} />
          </>
        )}

        {activeTab === 'details' && (
          <>
            {allAttributeNames.map((attrName) => {
              const attrValues = listings.map((l) => {
                const attr = l.attributes?.find((a) => a.attribute_name === attrName);
                if (!attr) return null;
                if (attr.value_number !== undefined) return String(attr.value_number) + (attr.unit ? ` ${attr.unit}` : '');
                if (attr.value_text) return attr.value_text;
                if (attr.value_boolean !== undefined) return attr.value_boolean ? t('yes') : t('no');
                return attr.display_value || null;
              });
              return <Row key={attrName} label={attrName} values={attrValues} />;
            })}
          </>
        )}

        {activeTab === 'features' && (
          <>
            {allAmenityNames.map((amenityName) => {
              const amenityValues = listings.map((l) =>
                l.amenities?.some((a) => a.amenity_name === amenityName) ? 'yes' : 'no'
              );
              return (
                <Row
                  key={amenityName}
                  label={amenityName}
                  values={amenityValues}
                  renderValue={(v) => (
                    v === 'yes'
                      ? <Check className="h-5 w-5 text-emerald-500" />
                      : <X className="h-5 w-5 text-red-400" />
                  )}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
