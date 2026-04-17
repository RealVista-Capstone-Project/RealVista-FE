/** Matches GET /me/agent-profile (snake_case JSON). */
export interface AgentProfile {
  agent_profile_id: string;
  user_id: string;
  bio?: string | null;
  specialties?: string | null;
  service_areas?: string | null;
  rating?: string | number | null;
  years_of_experience?: number | null;
  properties_sold?: number | null;
}

export interface UpdateAgentProfilePayload {
  bio?: string;
  specialties?: string;
  service_areas?: string;
  years_of_experience?: number;
}

/** Matches GET /api/v1/agents?property_id=... */
export interface AgentListItem {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialties: string | null;
  service_areas: string | null;
  rating: number | null;
  years_of_experience: number | null;
  properties_sold: number | null;
  engagement_status: string | null;
  engagement_id: string | null;
  engagement_type: string | null;
}

/** Matches GET /api/v1/agents/{agentId}/reviews */
export interface AgentReview {
  review_id: string;
  engagement_id: string;
  agent_user_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
