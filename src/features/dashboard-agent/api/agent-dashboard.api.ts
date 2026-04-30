import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type {
  AgentAppointmentsSnapshot,
  AgentAppointmentsSnapshotResponse,
  AgentDashboardMetrics,
  AgentDashboardMetricsResponse,
  AgentPerformancePeriod,
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

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getFallbackAppointmentsSnapshot(): AgentAppointmentsSnapshot {
  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 29);

  return {
    range: {
      startDate: toIsoDate(startDate),
      endDate: toIsoDate(endDate),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    calendarDays: [],
    appointments: [],
  };
}

function normalizeAppointmentsSnapshot(snapshot: AgentAppointmentsSnapshot): AgentAppointmentsSnapshot {
  return {
    range: snapshot?.range ?? getFallbackAppointmentsSnapshot().range,
    calendarDays: Array.isArray(snapshot?.calendarDays) ? snapshot.calendarDays : [],
    appointments: Array.isArray(snapshot?.appointments) ? snapshot.appointments : [],
  };
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
  getPerformance: async (period: AgentPerformancePeriod = 'M'): Promise<AgentPerformanceMetricsResponse> => {
    const performance = await safeGet<AgentPerformanceMetrics>(
      `/listings/analytics/agent-performance?period=${period}`,
      { period, trend: [], channels: [] },
    );

    return {
      success: true,
      message: 'Agent performance metrics fetched successfully.',
      timestamp: new Date().toISOString(),
      data: performance,
    };
  },
  getAppointmentsSnapshot: async (): Promise<AgentAppointmentsSnapshotResponse> => {
    const fallback = getFallbackAppointmentsSnapshot();
    const query = new URLSearchParams({
      start_date: fallback.range.startDate,
      end_date: fallback.range.endDate,
    });
    const raw = await safeGet<AgentAppointmentsSnapshot>(
      `/appointments/dashboard-snapshot?${query.toString()}`,
      fallback
    );
    const snapshot = normalizeAppointmentsSnapshot(raw);

    return {
      success: true,
      message: 'Agent appointments fetched.',
      timestamp: new Date().toISOString(),
      data: snapshot,
    };
  },
  getPlanSnapshot: async (): Promise<AgentPlanSnapshotResponse> => {
    return DEFAULT_PLAN_SNAPSHOT;
  },
};
