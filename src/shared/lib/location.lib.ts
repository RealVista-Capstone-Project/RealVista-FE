export function extractStreetAddress(
  formattedAddress: string,
  components?: google.maps.GeocoderAddressComponent[]
): string {
  if (!formattedAddress) return '';

  const segments = formattedAddress.split(',').map((s) => s.trim());
  if (!components || components.length === 0) {
    // If no components available, assume the first segment is the street address
    return segments[0];
  }

  /**
   * Administrative Boundary Types in Vietnam (broadest to most specific)
   * We exclude these levels from the specific street address.
   */
  const administrativeTypes = [
    'sublocality_level_1', // Ward (Phường/Xã/Thị trấn)
    'neighborhood', // Neighborhood
    'administrative_area_level_2', // District (Quận/Huyện/Thị xã)
    'administrative_area_level_1', // City/Province (Tỉnh/Thành phố)
    'locality',
    'postal_code',
    'country',
  ];

  // Map all administrative names for comparison
  const adminNames = new Set<string>();
  components
    .filter((c) => c.types.some((t) => administrativeTypes.includes(t)))
    .forEach((c) => {
      adminNames.add(c.long_name.toLowerCase());
      adminNames.add(c.short_name.toLowerCase());
      // Add variations without prefixes to handle "Phường 12" vs "12"
      const stripped = c.long_name
        .replace(/^(Phường|Xã|Thị trấn|Quận|Huyện|Thị xã|Thành phố|Tỉnh|Tp\.)\s+/i, '')
        .trim()
        .toLowerCase();
      if (stripped.length > 0) adminNames.add(stripped);
    });

  /**
   * Logic: Iterate through address segments from left to right.
   * The first segment that matches an administrative component's name
   * marks the start of the geographical hierarchy.
   */
  let firstAdminIndex = segments.length;

  for (let i = 0; i < segments.length; i++) {
    // Normalize both for comparison (NFC handles combining characters in Vietnamese)
    const segment = segments[i].toLowerCase().normalize('NFC');

    const isAdmin = Array.from(adminNames).some((adminNameRaw) => {
      const adminName = adminNameRaw.normalize('NFC');

      // Avoid matching single digits to prevent "11 Đoàn Văn Bơ" matching "Quận 11"
      if (adminName.length <= 1 && !isNaN(Number(adminName))) return false;

      // Primary check: Exact match or standard prefixed match
      const exactOrPrefixed =
        segment === adminName ||
        segment === `phường ${adminName}` ||
        segment === `quận ${adminName}` ||
        segment === `huyện ${adminName}` ||
        segment === `thành phố ${adminName}` ||
        segment === `tp. ${adminName}` ||
        segment === `xã ${adminName}`;

      if (exactOrPrefixed) return true;

      // Secondary check: Segment starts with admin name (handles "Hồ Chí Minh 700000")
      // Only for longer, more specific admin names to avoid false positives
      if (adminName.length >= 3 && segment.startsWith(adminName)) {
        const nextChar = segment.charAt(adminName.length);
        if (!nextChar || nextChar === ' ' || !isNaN(Number(nextChar))) {
          return true;
        }
      }

      return false;
    });

    if (isAdmin) {
      firstAdminIndex = i;
      break;
    }
  }

  // Join everything before the first admin segment
  const streetAddressResult = segments.slice(0, firstAdminIndex).join(', ');

  // Final fallback if the result is empty (e.g., if the first segment was accidentally matched as admin)
  return streetAddressResult || segments[0];
}
