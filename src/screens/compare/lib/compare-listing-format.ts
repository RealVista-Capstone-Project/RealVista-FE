import type { Attribute, Listing } from '@/entities/listing/model/types';
import { formatVND } from '@/shared/lib/utils';

export function listingPrimaryImageUrl(listing: Listing): string {
  const primary = listing.media?.find((m) => m.is_primary) ?? listing.media?.[0];
  return primary?.thumbnail_url || primary?.media_url || '';
}

export function listingFullAddress(listing: Listing): string {
  const parts = [
    listing.location?.ward_name,
    listing.location?.district_name,
    listing.location?.city_name,
  ].filter(Boolean);
  return parts.join(', ') || listing.property?.street_address || '—';
}

export function formatAttributeCell(attr: Attribute | undefined): string {
  if (!attr) return '—';
  const dv = attr.display_value;
  if (dv != null && String(dv).trim() !== '' && String(dv) !== 'undefined') {
    return String(dv);
  }
  if (attr.data_type === 'BOOLEAN' && attr.value_boolean != null) {
    return attr.value_boolean ? '✓' : '—';
  }
  if (attr.value_number != null) {
    const u = attr.unit ? ` ${attr.unit}` : '';
    return `${attr.value_number}${u}`;
  }
  if (attr.value_text) return attr.value_text;
  return '—';
}

export function mergeAttributeRows(a: Listing, b: Listing): { code: string; label: string }[] {
  const map = new Map<string, string>();
  for (const attr of [...(a.attributes ?? []), ...(b.attributes ?? [])]) {
    if (!map.has(attr.attribute_code)) {
      map.set(attr.attribute_code, attr.attribute_name);
    }
  }
  return [...map.entries()]
    .map(([code, label]) => ({ code, label }))
    .sort((x, y) => x.label.localeCompare(y.label, undefined, { sensitivity: 'base' }));
}

export function formatPublishedAt(iso: string | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    const loc = locale === 'vi' ? 'vi-VN' : 'en-US';
    return new Date(iso).toLocaleDateString(loc, { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}
