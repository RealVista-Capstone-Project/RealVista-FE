import type { ListingAttribute } from '@/shared/ui/realvista-listing-card/realvista-listing-card';

export interface AgentEngagement {
  agent_user_id: string;
  agent_full_name: string;
  agent_avatar_url: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  agent_bio: string | null;
  agent_specialties: string[] | string | null;
  agent_service_areas: string[] | string | null;
  agent_rating: number | null;
  agent_years_of_experience: number | null;
  agent_properties_sold: number | null;
  property_id: string;
  property_address: string | null;
  property_type_name: string | null;
  property_location_name: string | null;
  engagement_id: string;
  engagement_type: string;
  status: string;
  hired_at: string;
  has_review?: boolean;
  content?: any | null;
  cancellation_reason?: string | null;
  /** The single listing sold by the agent for this engagement's property.
   *  Per business rule, at most one listing per engagement can reach SOLD status.
   *  Null / absent means no sold listing yet — the card will be hidden. */
  sold_listing?: AgentListing | null;
}

export interface CreateReviewPayload {
  engagement_id: string;
  rating: number;
  comment?: string;
}

export interface CancelEngagementPayload {
  engagement_id: string;
  reason: string;
}

/**
 * Payload to submit an existing agent proposal template as an engagement for a specific property.
 * This creates an Engagement of type AGENT_PROPOSAL on the server.
 *
 * BE endpoint (to be implemented): POST /api/v1/engagements/agent-proposal
 */
export interface SubmitAgentProposalPayload {
  /** The UUID of the AgentProposal template to submit */
  agent_proposal_id: string;
  /** The UUID of the Property this proposal targets */
  property_id: string;
  /** Optional personal message to send along with the proposal template */
  message?: string;
}

export interface AgentEngagementPageResponse {
  content: AgentEngagement[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
}

export interface GetAgentEngagementsParams {
  page?: number;
  size?: number;
  status?: string;
  search?: string;
}

/** Listing created by an agent for a specific property/engagement. */
export interface AgentListing {
  listing_id: string;
  title: string;
  /** Sale/rental price in VND. Required by RealVistaListingCard. */
  price: number;
  image_url: string | null;
  /** e.g. "ACTIVE", "SOLD", "EXPIRED" */
  status: string;
  created_at?: string;
  address?: string;
  property_type?: string;
  listing_type?: 'RENT' | 'SALE';
  /** Dynamic property attributes (beds, bathrooms, area, etc.) — same shape as listing detail. */
  attributes?: ListingAttribute[];
}
