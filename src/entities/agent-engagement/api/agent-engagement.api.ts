import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type {
  AgentEngagement,
  AgentEngagementPageResponse,
  GetAgentEngagementsParams,
  CreateReviewPayload,
  SubmitAgentProposalPayload,
  AgentProposalApplyState,
} from '../model/types';
import type { ListingAttribute } from '@/shared/ui/realvista-listing-card/realvista-listing-card';

/** Raw snake_case shape returned by GET /engagements/{id} */
interface RawEngagementDetail {
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
  has_review: boolean;
  cancellation_reason: string | null;
  content: string | null;
  /** Single sold listing embedded in the detail response (max 1 per engagement). */
  sold_listing?: {
    listing_id: string;
    title: string;
    price: number;
    image_url: string | null;
    status: string;
    listing_type?: 'RENT' | 'SALE';
    address?: string;
    attributes?: ListingAttribute[];
  } | null;
}

function mapDetailResponse(raw: RawEngagementDetail): AgentEngagement {
  return {
    agent_user_id: raw.agent_user_id,
    agent_full_name: raw.agent_full_name,
    agent_avatar_url: raw.agent_avatar_url,
    agent_phone: raw.agent_phone,
    agent_email: raw.agent_email,
    agent_bio: raw.agent_bio,
    agent_specialties: raw.agent_specialties,
    agent_service_areas: raw.agent_service_areas,
    agent_rating: raw.agent_rating,
    agent_years_of_experience: raw.agent_years_of_experience,
    agent_properties_sold: raw.agent_properties_sold,
    property_id: raw.property_id,
    property_address: raw.property_address,
    property_type_name: raw.property_type_name,
    property_location_name: raw.property_location_name,
    engagement_id: raw.engagement_id,
    engagement_type: raw.engagement_type,
    status: raw.status,
    hired_at: raw.hired_at,
    has_review: raw.has_review,
    cancellation_reason: raw.cancellation_reason,
    content: raw.content,
    sold_listing: raw.sold_listing ?? null,
  };
}

function buildUrl(params: GetAgentEngagementsParams): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params.size !== undefined) {
    searchParams.set('size', String(params.size));
  }
  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }

  const queryString = searchParams.toString();
  return `/engagements/hired-agents${queryString ? `?${queryString}` : ''}`;
}

export const agentEngagementApi = {
  getHiredAgents: (params: GetAgentEngagementsParams = {}) =>
    http.get<ApiResponse<AgentEngagementPageResponse>>(buildUrl(params)),

  /** Fetch a single engagement by ID. Maps camelCase response to snake_case AgentEngagement. */
  getEngagementById: async (id: string) => {
    const res = await http.get<ApiResponse<RawEngagementDetail>>(`/engagements/${id}`);
    return {
      ...res,
      payload: {
        ...res.payload,
        data: mapDetailResponse(res.payload.data),
      },
    };
  },

  finishEngagement: (id: string) =>
    http.put<ApiResponse<void>>(`/engagements/${id}/finish`, null),

  cancelEngagement: (id: string, reason: string) =>
    http.put<ApiResponse<void>>(`/engagements/${id}/cancel`, { reason }),

  submitReview: (payload: CreateReviewPayload) =>
    http.post<ApiResponse<void>>(`/engagements/${payload.engagement_id}/reviews`, {
      rating: payload.rating,
      comment: payload.comment,
    }),

  /**
   * Submit an AgentProposal template as a new Engagement for a specific property.
   *
   * Creates an Engagement of type `AGENT_PROPOSAL` linking the agent to the property owner.
   * The agent is the initiator; the property owner becomes the receiver.
   *
   * @param payload { agent_proposal_id, property_id }
   * @returns the newly created Engagement ID
   *
   * NOTE: BE endpoint `POST /api/v1/engagements/agent-proposal` to be implemented by BE team.
   */
  submitAgentProposal: (payload: SubmitAgentProposalPayload) =>
    http.post<ApiResponse<{ engagement_id: string }>>('/engagements/agent-proposal', {
      agent_proposal_id: payload.agent_proposal_id,
      property_id: payload.property_id,
      message: payload.message,
    }),

  getAgentProposalApplyState: (initiatorId: string, receiverId: string, propertyId: string) => {
    const params = new URLSearchParams({
      initiator_id: initiatorId,
      receiver_id: receiverId,
      property_id: propertyId,
    });
    return http.get<ApiResponse<AgentProposalApplyState>>(
      `/engagements/agent-proposal/apply-state?${params.toString()}`
    );
  },
} as const;

