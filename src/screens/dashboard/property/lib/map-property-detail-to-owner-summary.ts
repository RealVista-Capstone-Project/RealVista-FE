import type {
  PropertyDetailResponse,
  PropertyMediaItem,
  PropertySummaryResponse,
  PropertyAttributeItem,
  PropertyAmenityItem,
} from '@/entities/property/api/property-api.types';

function toFiniteNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : null;
}

function coerceStatus(status: string): PropertySummaryResponse['status'] {
  const allowed: PropertySummaryResponse['status'][] = [
    'DRAFT',
    'PENDING',
    'VERIFIED',
    'REJECTED',
    'AVAILABLE',
    'RESERVED',
    'SOLD',
    'RENTED',
  ];
  return (allowed.includes(status as PropertySummaryResponse['status'])
    ? status
    : 'DRAFT') as PropertySummaryResponse['status'];
}

function mapDetailMedia(
  rows: NonNullable<PropertyDetailResponse['media']>
): PropertyMediaItem[] {
  return rows.map((m) => {
    let media_type: PropertyMediaItem['media_type'] = 'IMAGE';
    if (m.media_type === 'VIDEO') media_type = 'VIDEO';
    else if (m.media_type === 'THREE_D' || m.media_type === 'VIRTUAL_TOUR')
      media_type = 'THREE_D';

    return {
      media_id: m.media_id,
      media_type,
      media_url: m.media_url,
      thumbnail_url: m.thumbnail_url,
      is_primary: m.is_primary,
      is_property_standard: null,
      display_order: null,
      metadata: m.metadata ?? undefined,
    };
  });
}

function mapDetailAttributes(
  rows: NonNullable<PropertyDetailResponse['attributes']>
): PropertyAttributeItem[] {
  return rows.map((a) => {
    const display_value =
      a.value_number != null
        ? String(a.value_number)
        : a.value_text != null
          ? a.value_text
          : a.value_boolean != null
            ? String(a.value_boolean)
            : null;
    return {
      attribute_id: a.attribute_id,
      attribute_code: a.attribute_code,
      attribute_name: a.attribute_name,
      data_type: a.data_type,
      icon: a.icon,
      unit: a.unit,
      value_number: a.value_number,
      value_text: a.value_text,
      value_boolean: a.value_boolean,
      display_value,
    };
  });
}

function mapDetailAmenities(
  rows: NonNullable<PropertyDetailResponse['amenities']>
): PropertyAmenityItem[] {
  return rows.map((a) => ({
    amenity_id: a.amenity_id,
    amenity_name: a.amenity_name,
  }));
}

/**
 * Aligns GET /properties/:id payload with the owner dashboard detail panel, which was built for
 * {@link PropertySummaryResponse} from `/properties/me`.
 */
export function mapPropertyDetailToOwnerSummary(
  d: PropertyDetailResponse
): PropertySummaryResponse {
  const media = d.media?.length ? mapDetailMedia(d.media) : null;

  const thumbnail_url =
    media?.find((x) => x.is_primary && x.media_url)?.thumbnail_url ??
    media?.find((x) => x.is_primary && x.media_url)?.media_url ??
    media?.find((x) => x.media_url)?.thumbnail_url ??
    media?.find((x) => x.media_url)?.media_url ??
    null;

  const usable = toFiniteNumber(d.usable_size_m2);
  const area_sqft =
    usable != null ? Math.round(usable * 10.764 * 100) / 100 : null;

  const has3FromMedia = !!(media && media.some((m) => m.media_type === 'THREE_D'));
  const has_3d = d.has_3d === true || has3FromMedia;

  const usable_size_m2 = toFiniteNumber(d.usable_size_m2);
  const land_size_m2 = toFiniteNumber(d.land_size_m2);
  const width_m = toFiniteNumber(d.width_m);
  const length_m = toFiniteNumber(d.length_m);

  return {
    property_id: String(d.property_id),
    owner_id: String(d.owner_id),
    property_type_id: String(d.property_type_id),
    street_address: d.street_address,
    status: coerceStatus(d.status),
    land_size_m2,
    usable_size_m2,
    width_m,
    length_m,
    area_sqft,
    description: d.descriptions ?? null,
    property_type_info: d.property_type_info
      ? {
          property_type_id: String(d.property_type_info.property_type_id ?? d.property_type_id),
          property_type_name: d.property_type_info.property_type_name ?? null,
          property_type_code: d.property_type_info.property_type_code ?? d.property_type_code ?? null,
          property_category_id: d.property_type_info.property_category_id ?? null,
          property_category_name: d.property_type_info.property_category_name ?? null,
          property_category_code: d.property_type_info.property_category_code ?? null,
        }
      : {
          property_type_id: String(d.property_type_id),
          property_type_name: null,
          property_type_code: d.property_type_code ?? null,
          property_category_id: null,
          property_category_name: null,
          property_category_code: null,
        },
    location_info: d.location_info
      ? {
          location_id: String(d.location_info.location_id ?? d.location_id),
          city_name: d.location_info.city_name ?? null,
          district_name: d.location_info.district_name ?? null,
          ward_name: d.location_info.ward_name ?? null,
          latitude: toFiniteNumber(d.location_info.latitude ?? d.latitude),
          longitude: toFiniteNumber(d.location_info.longitude ?? d.longitude),
        }
      : {
          location_id: String(d.location_id),
          city_name: null,
          district_name: null,
          ward_name: null,
          latitude: toFiniteNumber(d.latitude),
          longitude: toFiniteNumber(d.longitude),
        },
    attributes: d.attributes?.length ? mapDetailAttributes(d.attributes) : null,
    media,
    thumbnail_url: d.thumbnail_url ?? thumbnail_url,
    amenities: d.amenities?.length ? mapDetailAmenities(d.amenities) : null,
    owner_name: d.owner_name ?? null,
    owner_email: d.owner_email ?? null,
    owner_avatar_url: d.owner_avatar_url ?? null,
    owner_phone: d.owner_phone ?? null,
    owner_phone_display: d.owner_phone_display ?? null,
    is_owner_phone_hidden: d.is_owner_phone_hidden ?? null,
    has_3d,
    price_range: d.price_range ?? null,
    allow_rent_listing_when_rented: Boolean(d.allow_rent_listing_when_rented),
    flagged_for_admin_review: d.flagged_for_admin_review ?? null,
    duplicate_override_reason: d.duplicate_override_reason ?? null,
    sold_by_user_id: d.sold_by_user_id ?? null,
    sold_by_name: d.sold_by_name ?? null,
    sold_by_phone: d.sold_by_phone ?? null,
    sold_by_role: d.sold_by_role ?? null,
    sold_at: d.sold_at ?? null,
  };
}
