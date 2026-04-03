/**
 * Refined Vietnamese address extraction logic.
 * Instead of splitting by comma, we identify geographical boundaries (Ward, District, City)
 * and extract everything prior to the first boundary in the formatted address string.
 */
export function extractStreetAddress(
  formattedAddress: string,
  components?: google.maps.GeocoderAddressComponent[]
): string {
  if (!formattedAddress) return '';
  if (!components || components.length === 0) {
    // If no components, fallback to first comma as a last resort
    return formattedAddress.split(',')[0].trim();
  }

  // Boundary types in Vietnam (broadest to most specific)
  // We want to stop at the first descriptive administrative level
  const boundaryTypes = [
    'sublocality_level_1', // Ward (Phường/Xã)
    'neighborhood',        // Sometimes used for smaller wards/clusters
    'sublocality',
    'administrative_area_level_2', // District (Quận/Huyện)
    'administrative_area_level_1', // City/Province (Tỉnh/Thành phố)
    'locality',
    'country',
  ];

  // Find the first boundary component that appears in the string
  // We exclude 'street_number' and 'route' themselves
  const boundaries = components
    .filter((c) => c.types.some((t) => boundaryTypes.includes(t)))
    .filter((c) => !c.types.includes('street_number') && !c.types.includes('route'));

  if (boundaries.length > 0) {
    // Find the boundary that appears EARLIEST in the formatted address string
    let earliestIndex = -1;

    for (const b of boundaries) {
      const idx = formattedAddress.indexOf(b.long_name);
      if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
        earliestIndex = idx;
      }
    }

    if (earliestIndex !== -1) {
      // Return everything before this boundary, cleaning up trailing punctuation
      return formattedAddress
        .substring(0, earliestIndex)
        .trim()
        .replace(/[,/-\s]+$/, '') // Remove trailing commas, slashes, dashes, or spaces
        .trim();
    }
  }

  // Final fallback
  return formattedAddress.split(',')[0].trim();
}
