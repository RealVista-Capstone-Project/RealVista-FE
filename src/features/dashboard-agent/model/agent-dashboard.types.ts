import type { ApiResponse } from '@/shared/types/api-response';

export interface AgentPerformancePoint {
  month: string;
  views: number;
  inquiries: number;
  closedDeals: number;
}

export interface AgentChannelPerformanceItem {
  channel: string;
  leads: number;
  conversionRate: number;
}

export interface ManagedListingSummary {
  all: number;
  rent: number;
  sale: number;
}

export interface PropertySummaryMetrics {
  totalProperties: number;
  availableProperties: number;
  reservedProperties: number;
  soldProperties: number;
  rentedProperties: number;
  draftProperties: number;
  pendingProperties: number;
  verifiedProperties: number;
  rejectedProperties: number;
}

export interface AppointmentSummaryMetrics {
  totalAppointments: number;
  pendingAppointments: number;
  acceptedAppointments: number;
  rejectedAppointments: number;
  canceledAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
}

export interface LeadSourceSummary {
  source: string;
  count: number;
}

export interface LeadSummaryMetrics {
  totalLeads: number;
  closedLeads: number;
  previousTotalLeads: number;
  previousClosedLeads: number;
  bySource: LeadSourceSummary[];
}

export interface AppointmentItem {
  appointmentId: string;
  listingId: string;
  listingName: string;
  listingAddress: string;
  startTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED';
}

export interface AgentPlanSnapshot {
  planName: string;
  renewsAt: string;
  listingQuotaUsed: number;
  listingQuotaTotal: number;
  boostsUsed: number;
  boostsTotal: number;
}

export interface AgentDashboardMetrics {
  listingSummary: ManagedListingSummary;
  propertySummary: PropertySummaryMetrics;
  appointmentSummary: AppointmentSummaryMetrics;
  crmSummary: LeadSummaryMetrics;
}

export interface AgentPerformanceMetrics {
  trend: AgentPerformancePoint[];
  channels: AgentChannelPerformanceItem[];
}

export interface AgentAppointmentsSnapshot {
  appointments: AppointmentItem[];
}

export type AgentDashboardMetricsResponse = ApiResponse<AgentDashboardMetrics>;
export type AgentPerformanceMetricsResponse = ApiResponse<AgentPerformanceMetrics>;
export type AgentAppointmentsSnapshotResponse = ApiResponse<AgentAppointmentsSnapshot>;
export type AgentPlanSnapshotResponse = ApiResponse<AgentPlanSnapshot>;
