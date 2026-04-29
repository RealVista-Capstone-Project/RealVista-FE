import { LeadStatus } from '../types/lead';

export interface LeadListFilters {
  status?: LeadStatus;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  size?: number;
}

export interface LeadSummaryFilters {
  from?: string;
  to?: string;
  q?: string;
}

export const leadKeys = {
  all: ['crm', 'leads'] as const,
  list: (filters?: LeadListFilters) => [...leadKeys.all, 'list', filters ?? {}] as const,
  summary: (filters?: LeadSummaryFilters) => [...leadKeys.all, 'summary', filters ?? {}] as const,
  detail: (leadId: string) => [...leadKeys.all, 'detail', leadId] as const,
};
