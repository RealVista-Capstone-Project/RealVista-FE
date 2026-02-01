import type { Listing } from '../model/types';
import type { Property } from '@/entities/property';

/**
 * Maps Listing API response to Property type
 * This adapter transforms the backend listing structure to the frontend Property model
 */
export function mapListingToProperty(listing: Listing): Property {
  // Extract amenity names from attributes
  const amenities = listing.attributes
    .filter((attr) => attr.value_boolean === true || attr.value_number || attr.value_text)
    .map((attr) => attr.attribute_name);

  // Map media items to PropertyImage format
  const images = listing.media.map((media) => {
    let type: 'photo' | '3d-tour' | 'video' = 'photo';
    if (media.media_type === 'VIDEO') type = 'video';
    if (media.media_type === 'THREE_D') type = '3d-tour';

    return {
      id: media.media_id,
      url: media.media_url,
      thumbnailUrl: media.thumbnail_url,
      alt: `${listing.slug}-${media.media_type}`,
      type,
      isPrimary: media.is_primary,
    };
  });

  // Build full address
  const addressParts = [
    listing.property.street_address,
    listing.location.ward_name,
    listing.location.district_name,
    listing.location.city_name,
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  return {
    id: listing.listing_id,
    title: listing.name, // Using the new name field from API
    address: fullAddress,
    price: listing.price,
    bedrooms: listing.property.bedrooms,
    bathrooms: listing.property.bathrooms,
    area: listing.property.usable_size_m2,
    description: listing.property.description,
    images,
    amenities,
    location: {
      lat: listing.location.latitude,
      lng: listing.location.longitude,
    },
    agent: {
      id: listing.agent.user_id,
      name: listing.agent.full_name,
      avatar: listing.agent.avatar_url,
      phone: listing.agent.phone,
      email: listing.agent.email,
    },
    createdAt: listing.created_at,
    updatedAt: listing.updated_at,
  };
}
