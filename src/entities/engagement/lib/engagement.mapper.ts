import { Engagement, EngagementContent } from '../model/types';

function parseContent(raw: unknown): EngagementContent | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'object') return raw as EngagementContent;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as EngagementContent;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function mapToEngagement(item: Record<string, unknown>): Engagement {
  return {
    engagementId: (item.engagement_id ?? item.engagementId) as string,
    initiatorId: (item.initiator_id ?? item.initiatorId) as string,
    receiverId: (item.receiver_id ?? item.receiverId) as string,
    engagementType: (item.engagement_type ?? item.engagementType) as Engagement['engagementType'],
    content: parseContent(item.content),
    listingId: (item.listing_id ?? item.listingId) as string | undefined,
    propertyId: (item.property_id ?? item.propertyId) as string | undefined,
    status: item.status as Engagement['status'],

    listingTitle: (item.listing_title ?? item.listingTitle) as string | undefined,
    propertyAddress: (item.property_address ?? item.propertyAddress) as string | undefined,
    propertyImageUrl: (item.property_image_url ?? item.propertyImageUrl) as string | undefined,
    propertyMediaUrls: (item.property_media_urls ?? item.propertyMediaUrls) as string[] | undefined,

    agentUserId: (item.agent_user_id ?? item.agentUserId) as string | undefined,
    agentFullName: (item.agent_full_name ?? item.agentFullName) as string | undefined,
    agentAvatarUrl: (item.agent_avatar_url ?? item.agentAvatarUrl) as string | undefined,
    agentPhone: (item.agent_phone ?? item.agentPhone) as string | undefined,
    agentEmail: (item.agent_email ?? item.agentEmail) as string | undefined,
    agentBio: (item.agent_bio ?? item.agentBio) as string | undefined,
    agentSpecialties: (item.agent_specialties ?? item.agentSpecialties) as string | undefined,
    agentServiceAreas: (item.agent_service_areas ?? item.agentServiceAreas) as string | undefined,
    agentRating: (item.agent_rating ?? item.agentRating) as number | undefined,
    agentYearsOfExperience: (item.agent_years_of_experience ?? item.agentYearsOfExperience) as
      | number
      | undefined,
    agentPropertiesSold: (item.agent_properties_sold ?? item.agentPropertiesSold) as
      | number
      | undefined,

    propertyTypeName: (item.property_type_name ?? item.propertyTypeName) as string | undefined,
    propertyLocationName: (item.property_location_name ?? item.propertyLocationName) as
      | string
      | undefined,

    hiredAt: (item.hired_at ?? item.hiredAt) as string | undefined,
    hasReview: (item.has_review ?? item.hasReview) as boolean | undefined,
    cancellationReason: (item.cancellation_reason ?? item.cancellationReason) as string | undefined,

    initiatorName: (item.initiator_name ?? item.initiatorName) as string | undefined,
    receiverName: (item.receiver_name ?? item.receiverName) as string | undefined,
    receiverAvatarUrl: (item.receiver_avatar_url ?? item.receiverAvatarUrl) as string | undefined,

    createdAt: (item.created_at ?? item.createdAt) as string,
    updatedAt: (item.updated_at ?? item.updatedAt) as string,
  };
}
