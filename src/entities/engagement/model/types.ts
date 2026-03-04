export enum EngagementStatus {
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum EngagementType {
  AGENT_PROPOSAL = 'AGENT_PROPOSAL',
  TENANT_APPLICATION = 'TENANT_APPLICATION',
  OWNER_INVITATION = 'OWNER_INVITATION',
}

export interface Engagement {
  engagementId: string;
  initiatorId: string;
  receiverId: string;
  engagementType: EngagementType;
  content?: string; // JSON string containing tenant application details
  listingId?: string;
  propertyId?: string;
  status: EngagementStatus;

  // Enriched listing info from backend mapper
  listingTitle?: string;
  propertyAddress?: string;
  propertyImageUrl?: string;

  createdAt: string;
  updatedAt: string;
}
