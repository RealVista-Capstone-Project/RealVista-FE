/** Matches GET/PATCH /me/agent-profile (snake_case JSON). */
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
