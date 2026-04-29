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

const DEFAULT_METRICS_PAYLOAD: AgentDashboardMetrics = {
  listingSummary: { all: 0, rent: 0, sale: 0 },
  propertySummary: {
    totalProperties: 0,
    availableProperties: 0,
    reservedProperties: 0,
    soldProperties: 0,
    rentedProperties: 0,
    draftProperties: 0,
    pendingProperties: 0,
    verifiedProperties: 0,
    rejectedProperties: 0,
  },
  appointmentSummary: {
    totalAppointments: 0,
    pendingAppointments: 0,
    acceptedAppointments: 0,
    rejectedAppointments: 0,
    canceledAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
  },
  crmSummary: {
    totalLeads: 0,
    closedLeads: 0,
    previousTotalLeads: 0,
    previousClosedLeads: 0,
    bySource: [],
  },
};

async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await http.get<ApiResponse<T>>(path);
    const data = response.payload?.data;
    if (data === null || data === undefined) {
      console.warn(`[agent-dashboard] Empty payload for ${path}, using fallback.`);
      return fallback;
    }
    return data;
  } catch (error) {
    console.error(`[agent-dashboard] Failed to load ${path}`, error);
    return fallback;
  }
}

async function getMetricsPayload(): Promise<AgentDashboardMetrics> {
  const [listingSummary, propertySummary, appointmentSummary, crmSummary] = await Promise.all([
    safeGet('/listings/managed-listings/summary', DEFAULT_METRICS_PAYLOAD.listingSummary),
    safeGet('/properties/me/summary', DEFAULT_METRICS_PAYLOAD.propertySummary),
    safeGet('/appointments/summary', DEFAULT_METRICS_PAYLOAD.appointmentSummary),
    safeGet('/crm/leads/summary', DEFAULT_METRICS_PAYLOAD.crmSummary),
  ]);

  return {
    listingSummary,
    propertySummary,
    appointmentSummary,
    crmSummary,
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
    const listingSummary = payload.listingSummary ?? DEFAULT_METRICS_PAYLOAD.listingSummary;
    const propertySummary = payload.propertySummary ?? DEFAULT_METRICS_PAYLOAD.propertySummary;
    const crmSummary = payload.crmSummary ?? DEFAULT_METRICS_PAYLOAD.crmSummary;
    const sourceItems = Array.isArray(crmSummary.bySource) ? crmSummary.bySource : [];
    const currentViews = Number(listingSummary.all ?? 0);
    const previousViews = Number(propertySummary.totalProperties ?? 0);
    const currentInquiries = Number(crmSummary.totalLeads ?? 0);
    const previousInquiries = Number(crmSummary.previousTotalLeads ?? 0);

    const performance: AgentPerformanceMetrics = {
      trend: [
        { month: 'Previous', views: previousViews, inquiries: previousInquiries, closedDeals: 0 },
        { month: 'Current', views: currentViews, inquiries: currentInquiries, closedDeals: 0 },
      ],
      channels: sourceItems.map((item) => ({
        channel: String(item?.source ?? 'unknown').toLowerCase(),
        leads: Number(item?.count ?? 0),
        conversionRate:
          currentInquiries > 0
            ? Math.round((Number(item?.count ?? 0) / currentInquiries) * 100)
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
    const appointmentsRaw = await safeGet<AgentAppointmentsSnapshot['appointments']>('/appointments', []);
    const appointments = Array.isArray(appointmentsRaw) ? appointmentsRaw : [];
    return {
      success: true,
      message: 'Agent appointments fetched.',
      timestamp: new Date().toISOString(),
      data: { appointments },
    };
  },
  getPlanSnapshot: async (): Promise<AgentPlanSnapshotResponse> => {
    return DEFAULT_PLAN_SNAPSHOT;
  },
};
