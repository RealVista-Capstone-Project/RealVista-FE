import { LeadStatus } from '../types/lead';

export const leadKeys = {
  all: ['crm', 'leads'] as const,
  list: (status?: LeadStatus) => [...leadKeys.all, 'list', status ?? 'all'] as const,
  detail: (leadId: string) => [...leadKeys.all, 'detail', leadId] as const,
};
