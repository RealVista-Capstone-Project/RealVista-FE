import type { SimilarListing } from '../model/types';
import type {
  RealVistaListingCardProps,
  ListingAttribute,
} from '@/shared/ui/realvista-listing-card/realvista-listing-card';

export interface SimilarListingCardProps extends Omit<
  RealVistaListingCardProps,
  'onToggleFavorite' | 'onClick'
> {
  slug: string; // Include slug for navigation
}

/**
 * Map SimilarListing from API to RealVistaListingCardProps
 * Passes dynamic attributes array for generic display
 */
export function mapSimilarListingToCardProps(listing: SimilarListing): SimilarListingCardProps {
  const attributes: ListingAttribute[] = listing.attributes.map((attr) => ({
    attribute_id: attr.attribute_id,
    attribute_code: attr.attribute_code,
    attribute_name: attr.attribute_name,
    icon: attr.icon ?? null,
    unit: attr.unit ?? null,
    value_number: attr.value_number ?? null,
    value_text: attr.value_text ?? null,
    value_boolean: attr.value_boolean ?? null,
  }));

  return {
    id: listing.listing_id,
    slug: listing.slug || listing.listing_id,
    image: listing.thumbnail_url,
    title: listing.name,
    address: listing.location_name,
    price: listing.price,
    currency: '',
    attributes,
    area: listing.area,
    areaUnit: 'm²',
    listingType: listing.listing_type,
    isFavorite: false,
  };
}

/**
 * Map array of SimilarListings to RealVistaListingCardProps
 */
export function mapSimilarListingsToCardProps(
  listings: SimilarListing[]
): SimilarListingCardProps[] {
  return listings.map(mapSimilarListingToCardProps);
}
