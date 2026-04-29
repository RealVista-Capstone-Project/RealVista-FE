import type { ApiResponse } from '@/shared/types/api-response';

export type TrendDirection = 'up' | 'down';

export interface AgentKpiItem {
  id: string;
  label: string;
  value: number;
  unit?: string;
  deltaPercent: number;
  trend: TrendDirection;
}

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

export interface AgentAppointmentItem {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  status: 'confirmed' | 'pending' | 'completed';
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
  kpis: AgentKpiItem[];
}

export interface AgentPerformanceMetrics {
  trend: AgentPerformancePoint[];
  channels: AgentChannelPerformanceItem[];
}

export interface AgentAppointmentsSnapshot {
  appointments: AgentAppointmentItem[];
}

export type AgentDashboardMetricsResponse = ApiResponse<AgentDashboardMetrics>;
export type AgentPerformanceMetricsResponse = ApiResponse<AgentPerformanceMetrics>;
export type AgentAppointmentsSnapshotResponse = ApiResponse<AgentAppointmentsSnapshot>;
export type AgentPlanSnapshotResponse = ApiResponse<AgentPlanSnapshot>;
