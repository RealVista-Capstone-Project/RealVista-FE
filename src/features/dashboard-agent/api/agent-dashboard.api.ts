import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type {
  AgentAppointmentsSnapshot,
  AgentAppointmentsSnapshotResponse,
  AgentDashboardMetrics,
  AgentDashboardMetricsResponse,
  AgentPerformanceMetrics,
  AgentPerformanceMetricsResponse,
  AgentPlanSnapshotResponse,
} from '../model/agent-dashboard.types';

const DEFAULT_PLAN_SNAPSHOT: AgentPlanSnapshotResponse = {
  success: true,
  message: 'Plan snapshot is not integrated yet.',
  timestamp: new Date().toISOString(),
  data: {
    planName: 'Agent',
    renewsAt: new Date().toISOString(),
    listingQuotaUsed: 0,
    listingQuotaTotal: 0,
    boostsUsed: 0,
    boostsTotal: 0,
  },
};

async function getMetricsPayload(): Promise<AgentDashboardMetrics> {
  const [listingSummary, propertySummary, appointmentSummary, crmSummary] = await Promise.all([
    http.get<ApiResponse<AgentDashboardMetrics['listingSummary']>>('/listings/managed-listings/summary'),
    http.get<ApiResponse<AgentDashboardMetrics['propertySummary']>>('/properties/me/summary'),
    http.get<ApiResponse<AgentDashboardMetrics['appointmentSummary']>>('/appointments/summary'),
    http.get<ApiResponse<AgentDashboardMetrics['crmSummary']>>('/crm/leads/summary'),
  ]);

  return {
    listingSummary: listingSummary.payload.data,
    propertySummary: propertySummary.payload.data,
    appointmentSummary: appointmentSummary.payload.data,
    crmSummary: crmSummary.payload.data,
  };
}

export const agentDashboardApi = {
  getMetrics: async (): Promise<AgentDashboardMetricsResponse> => {
    const payload = await getMetricsPayload();
    return {
      success: true,
      message: 'Agent dashboard metrics fetched successfully.',
      timestamp: new Date().toISOString(),
      data: payload,
    };
  },
  getPerformance: async (): Promise<AgentPerformanceMetricsResponse> => {
    const payload = await getMetricsPayload();
    const currentViews = payload.listingSummary.all;
    const previousViews = payload.propertySummary.totalProperties;
    const currentInquiries = payload.crmSummary.totalLeads;
    const previousInquiries = payload.crmSummary.previousTotalLeads;

    const performance: AgentPerformanceMetrics = {
      trend: [
        { month: 'Previous', views: previousViews, inquiries: previousInquiries, closedDeals: 0 },
        { month: 'Current', views: currentViews, inquiries: currentInquiries, closedDeals: 0 },
      ],
      channels: payload.crmSummary.bySource.map((item) => ({
        channel: item.source.toLowerCase(),
        leads: item.count,
        conversionRate:
          payload.crmSummary.totalLeads > 0
            ? Math.round((item.count / payload.crmSummary.totalLeads) * 100)
            : 0,
      })),
    };

    return {
      success: true,
      message: 'Agent performance metrics fetched successfully.',
      timestamp: new Date().toISOString(),
      data: performance,
    };
  },
  getAppointmentsSnapshot: async (): Promise<AgentAppointmentsSnapshotResponse> => {
    const response = await http.get<ApiResponse<AgentAppointmentsSnapshot['appointments']>>('/appointments');
    return {
      success: true,
      message: 'Agent appointments fetched successfully.',
      timestamp: new Date().toISOString(),
      data: { appointments: response.payload.data },
    };
  },
  getPlanSnapshot: async (): Promise<AgentPlanSnapshotResponse> => {
    return DEFAULT_PLAN_SNAPSHOT;
  },
};
