import type { SimilarListing } from '../model/types';
import type { RealVistaListingCardProps } from '@/shared/ui/realvista-listing-card/realvista-listing-card';

export interface SimilarListingCardProps extends Omit<RealVistaListingCardProps, 'onToggleFavorite' | 'onClick'> {
  slug: string; // Include slug for navigation
}

/**
 * Map SimilarListing from API to RealVistaListingCardProps
 * Extracts bedroom and bathroom counts from attributes array
 */
export function mapSimilarListingToCardProps(
  listing: SimilarListing
): SimilarListingCardProps {
  // Extract bedrooms and bathrooms from attributes
  const bedroomsAttr = listing.attributes.find(
    (attr) => attr.attribute_code === 'BEDROOMS'
  );
  const bathroomsAttr = listing.attributes.find(
    (attr) => attr.attribute_code === 'BATHROOMS'
  );

  const beds = bedroomsAttr?.value_number ?? 0;
  const bathrooms = bathroomsAttr?.value_number ?? 0;

  // Extract numeric price from display_price (remove dots and currency)
  // API returns price in smallest currency unit (like VND), need to format properly
  // For display, we'll use the raw price number and format it

  return {
    id: listing.listing_id,
    slug: listing.slug, // Include slug for navigation
    image: listing.thumbnail_url,
    title: listing.name,
    address: listing.location_name,
    price: listing.price,
    currency: '', // Currency is already included in display_price formatting
    beds,
    bathrooms,
    area: listing.area,
    areaUnit: 'm²',
    isPopular: false, // API doesn't provide popularity
    isFavorite: false, // Favorites are managed locally
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
