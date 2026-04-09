export enum AgentProposalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export interface AgentProposal {
  agent_proposal_id: string;
  user_id: string;
  title: string;

  commission_rate: number;
  experience_years: number;
  status: AgentProposalStatus;
  pitch_content: string;
  specialty?: string;
  price_range?: {
    rent?: { min: number; max: number };
    sale?: { min: number; max: number };
  };

  created_at: string;
  updated_at: string;
}

export interface ApplyAgentProposalPayload {
  title: string;
  commission_rate: number;
  experience_years: number;
  pitch_content: string;
  specialty?: string;
  price_range?: {
    rent?: { min: number; max: number };
    sale?: { min: number; max: number };
  };
}

export interface AgentProposalPageResponse {
  content: AgentProposal[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  last: boolean;
  first: boolean;
}
