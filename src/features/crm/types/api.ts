import { LeadStatus } from './lead';

export type LeadSource = 'MANUAL' | 'CHAT' | 'TOUR' | 'CALL';
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
  buyerId: string | null;
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

export interface CreateLeadRequest {
  fullName: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  listingId?: string;
  budget?: number;
  note?: string;
}

export interface UpdateLeadRequest {
  fullName: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  listingId?: string;
  budget?: number;
}

export interface UpdateLeadStatusRequest {
  status: LeadStatus;
}

export interface AddLeadNoteRequest {
  content: string;
}
