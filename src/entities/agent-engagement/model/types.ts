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
