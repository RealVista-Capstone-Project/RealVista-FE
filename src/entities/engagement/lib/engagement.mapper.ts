import { Engagement } from '../model/types';

export function mapToEngagement(item: any): Engagement {
  return {
    engagementId: item.engagement_id || item.engagementId,
    initiatorId: item.initiator_id || item.initiatorId,
    receiverId: item.receiver_id || item.receiverId,
    engagementType: item.engagement_type || item.engagementType,
    content: item.content,
    listingId: item.listing_id || item.listingId,
    propertyId: item.property_id || item.propertyId,
    status: item.status,
    listingTitle: item.listing_title || item.listingTitle,
    propertyAddress: item.property_address || item.propertyAddress,
    propertyImageUrl: item.property_image_url || item.propertyImageUrl,
    createdAt: item.created_at || item.createdAt,
    updatedAt: item.updated_at || item.updatedAt,
  };
}
