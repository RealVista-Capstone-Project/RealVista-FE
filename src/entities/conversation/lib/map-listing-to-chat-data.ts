import type { Listing } from '@/entities/listing';
import type { ChatListingData } from '@/entities/contact';

/**
 * Maps Listing API data to ChatListingData for ContactModal and message metadata
 */
export function mapListingToChatData(listing: Listing): ChatListingData {
  const primaryImage = listing.media.find((m) => m.is_primary) ?? listing.media[0];

  const addressParts = [
    listing.property.street_address,
    listing.location.district_name,
    listing.location.city_name,
  ].filter(Boolean);

  return {
    id: listing.listing_id,
    title: listing.name,
    image: primaryImage?.media_url ?? '',
    price: listing.price,
    currency: 'VND',
    address: addressParts.join(', '),
    area: listing.property.usable_size_m2,
    ownerId: listing.user_id,
    agentId: listing.agent?.user_id,
    listingStatus: listing.status,
  };
}
