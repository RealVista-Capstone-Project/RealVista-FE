import { LeadStatus } from './lead';

export type LeadSource = 'MANUAL' | 'CHAT' | 'TOUR';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface LeadNoteResponse {
  leadNoteId: string;
  listingLeadId: string;
  agentId: string;
  content: string;
  statusAtTime: LeadStatus;
  createdAt: string;
}

export interface LeadResponse {
  listingLeadId: string;
  agentId: string;
  listingId: string | null;
  listingName: string | null;
  buyerId: string | null;
  buyerAvatarUrl: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority | null;
  budget: number | null;
  notes: LeadNoteResponse[];
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSourceSummaryResponse {
  source: LeadSource;
  count: number;
}

export interface LeadSummaryResponse {
  totalLeads: number;
  closedLeads: number;
  previousTotalLeads: number;
  previousClosedLeads: number;
  bySource: LeadSourceSummaryResponse[];
}

export interface CreateLeadRequest {
  full_name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  listing_id?: string;
  buyer_id?: string;
  budget?: number;
  priority?: LeadPriority;
  status?: LeadStatus;
  note?: string;
}

export interface UpdateLeadRequest {
  full_name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  listing_id?: string;
  budget?: number;
  priority?: LeadPriority;
}

export interface UpdateLeadStatusRequest {
  status: LeadStatus;
}

export interface AddLeadNoteRequest {
  content: string;
}
