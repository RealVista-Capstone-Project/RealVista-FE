export enum EngagementStatus {
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  FINISHED = 'FINISHED',
}

export enum EngagementType {
  AGENT_PROPOSAL = 'AGENT_PROPOSAL',
  TENANT_APPLICATION = 'TENANT_APPLICATION',
  OWNER_INVITATION = 'OWNER_INVITATION',
}

export interface EngagementContent {
  title?: string;
  message?: string;
  commissionRate?: number;
  experienceYears?: number;
  pitchContent?: string;
  specialty?: string;
  priceRange?: {
    rent?: { min?: number; max?: number };
    sale?: { min?: number; max?: number };
  };
  offeredCommission?: string;
  monthlyIncome?: number;
  moveInDate?: string;
  leaseTermMonths?: number;
  note?: string;
}

export interface Engagement {
  engagementId: string;
  initiatorId: string;
  receiverId: string;
  engagementType: EngagementType;
  content?: EngagementContent;
  listingId?: string;
  propertyId?: string;
  status: EngagementStatus;

  // Enriched listing info from backend mapper
  listingTitle?: string;
  propertyAddress?: string;
  propertyImageUrl?: string;
  propertyMediaUrls?: string[];

  // Agent info (from HiredAgentResponse)
  agentUserId?: string;
  agentFullName?: string;
  agentAvatarUrl?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentBio?: string;
  agentSpecialties?: string;
  agentServiceAreas?: string;
  agentRating?: number;
  agentYearsOfExperience?: number;
  agentPropertiesSold?: number;

  // Property details
  propertyTypeName?: string;
  propertyLocationName?: string;

  // Engagement details
  hiredAt?: string;
  hasReview?: boolean;
  cancellationReason?: string;

  // Initiator / Receiver names for list views
  initiatorName?: string;
  receiverName?: string;
  receiverAvatarUrl?: string;

  createdAt: string;
  updatedAt: string;
}
