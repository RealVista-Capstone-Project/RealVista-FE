import type { Listing, CostBreakdownAPI, CostFeeAPI } from '../model/types';
import type { Property } from '@/entities/property';
import type { CostBreakdown, CostFee } from '@/shared/types';

/**
 * Maps cost breakdown from API format (snake_case) to frontend format (camelCase)
 */
function mapCostBreakdown(apiBreakdown: CostBreakdownAPI): CostBreakdown {
  return {
    basePrice: apiBreakdown.base_price,
    basePriceUnit: apiBreakdown.base_price_unit,
    requiredFees: (apiBreakdown.required_fees || []).map(mapCostFee),
    requiredFeesSubtotal: apiBreakdown.required_fees_subtotal,
    optionalFees: (apiBreakdown.optional_fees || []).map(mapCostFee),
    optionalFeesSubtotal: apiBreakdown.optional_fees_subtotal,
    totalCost: apiBreakdown.total_cost,
    disclaimer: apiBreakdown.disclaimer,
  };
}

/**
 * Maps cost fee from API format to frontend format
 */
function mapCostFee(apiFee: CostFeeAPI): CostFee {
  return {
    name: apiFee.name,
    amount: apiFee.amount,
    feeType: apiFee.fee_type,
  };
}

/**
 * Maps Listing API response to Property type
 * This adapter transforms the backend listing structure to the frontend Property model
 */
export function mapListingToProperty(listing: Listing): Property {
  // Map media items to PropertyImage format
  const images = (listing.media || []).map((media) => {
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

  // Map cost breakdown if present
  const costBreakdown = listing.cost_breakdown
    ? mapCostBreakdown(listing.cost_breakdown)
    : undefined;

  return {
    id: listing.listing_id,
    title: listing.name, // Using the new name field from API
    address: fullAddress,
    price: listing.price,
    area: listing.property.usable_size_m2,
    description: listing.property.description,
    attributes: listing.attributes || [],
    costBreakdown,
    images,
    amenities: listing.amenities || [],
    location: {
      lat: listing.location.latitude,
      lng: listing.location.longitude,
    },
    agent: {
      id: listing.agent.user_id,
      name: listing.agent.full_name,
      avatar: listing.agent.avatar_url,
      phone: listing.agent.phone ?? '',
      email: listing.agent.email ?? '',
    },
    createdAt: listing.created_at,
    updatedAt: listing.updated_at,
  };
}
