/**
 * Detect Ho Chi Minh City from Google Places / Geocoder formatted address & components (Vietnam).
 */

function toAsciiFolded(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isHoChiMinhCityRegion(
  components?: google.maps.GeocoderAddressComponent[],
  formattedAddress?: string
): boolean {
  const parts: string[] = [];
  if (formattedAddress?.trim()) {
    parts.push(formattedAddress);
  }
  components?.forEach((c) => {
    parts.push(c.long_name, c.short_name);
  });
  const raw = parts.join('\n');
  if (!raw.trim()) {
    return false;
  }

  const lowerRaw = raw.toLowerCase();

  const ascii = toAsciiFolded(raw);
  const asciiSpaced = ascii.replace(/\s+/g, ' ').trim();

  const admin1 = components?.find((c) => c.types.includes('administrative_area_level_1'));
  const admin1Text = admin1 ? `${admin1.long_name} ${admin1.short_name}` : '';
  const admin1Ascii = toAsciiFolded(admin1Text);
  const admin1Packed = admin1Ascii.replace(/[^a-z]/g, '');

  // TP.HCM / HCM abbreviation (avoid matching bare unrelated "hcm" substrings elsewhere)
  if (/\bt\.?\s*p\.?\s*h\.?\s*c\.?\s*m\.?\b/i.test(lowerRaw)) {
    return true;
  }

  // Vietnamese spelling (with tones, from raw components / address)
  if (
    lowerRaw.includes('hồ chí minh') ||
    lowerRaw.includes('thành phố hồ chí minh') ||
    lowerRaw.includes('sài gòn')
  ) {
    return true;
  }

  if (
    asciiSpaced.includes('ho chi minh') ||
    (admin1Packed.includes('thanhpho') && admin1Packed.includes('hochiminh')) ||
    admin1Packed.includes('hochiminhcity') ||
    admin1Packed.includes('hochiminh')
  ) {
    return true;
  }

  if (asciiSpaced.includes('saigon') || asciiSpaced.includes('sai gon')) {
    return true;
  }

  return false;
}
