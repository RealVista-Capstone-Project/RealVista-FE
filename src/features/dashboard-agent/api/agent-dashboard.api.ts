import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type {
  AgentDateRange,
  AgentAppointmentCalendarDay,
  AgentAppointmentCalendarRange,
  AgentAppointmentsSnapshot,
  AgentAppointmentsSnapshotResponse,
  AgentDashboardMetrics,
  AgentDashboardMetricsResponse,
  AgentPerformancePeriod,
  AgentPerformanceMetrics,
  AgentPerformanceMetricsResponse,
  AgentPlanSnapshot,
  AgentPlanSnapshotResponse,
  AgentPlanSubscriptionRow,
  AppointmentItem,
} from '../model/agent-dashboard.types';

const DEFAULT_PLAN_SNAPSHOT: AgentPlanSnapshotResponse = {
  success: true,
  message: 'Plan snapshot is not integrated yet.',
  timestamp: new Date().toISOString(),
  data: {
    subscriptions: [],
  },
};

const DEFAULT_METRICS_PAYLOAD: AgentDashboardMetrics = {
  listingSummary: {
    all: 0,
    rent: 0,
    sale: 0,
    currentMonthAll: 0,
    currentMonthRent: 0,
    currentMonthSale: 0,
    previousAll: 0,
    previousRent: 0,
    previousSale: 0,
  },
  propertySummary: {
    totalProperties: 0,
    currentMonthTotalProperties: 0,
    previousTotalProperties: 0,
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
    currentMonthTotalAppointments: 0,
    previousTotalAppointments: 0,
    pendingAppointments: 0,
    acceptedAppointments: 0,
    rejectedAppointments: 0,
    canceledAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    currentMonthUpcomingAppointments: 0,
    previousUpcomingAppointments: 0,
  },
  crmSummary: {
    totalLeads: 0,
    closedLeads: 0,
    previousTotalLeads: 0,
    previousClosedLeads: 0,
    bySource: [],
  },
  crmStatusSummary: {
    byStatus: [],
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

type LooseRecord = Record<string, unknown>;

function readStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function readNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function readBool(v: unknown): boolean {
  return typeof v === 'boolean' ? v : false;
}

function readNullableNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeListingSummary(payload: unknown): AgentDashboardMetrics['listingSummary'] {
  const fallback = DEFAULT_METRICS_PAYLOAD.listingSummary;
  if (!payload || typeof payload !== 'object') return fallback;
  const o = payload as LooseRecord;
  return {
    all: readNum(o.all ?? o.total ?? fallback.all),
    rent: readNum(o.rent ?? fallback.rent),
    sale: readNum(o.sale ?? fallback.sale),
    currentMonthAll: readNum(
      o.currentMonthAll ?? o.current_month_all ?? o.monthlyAll ?? o.monthly_all ?? fallback.currentMonthAll
    ),
    currentMonthRent: readNum(
      o.currentMonthRent ?? o.current_month_rent ?? o.monthlyRent ?? o.monthly_rent ?? fallback.currentMonthRent
    ),
    currentMonthSale: readNum(
      o.currentMonthSale ?? o.current_month_sale ?? o.monthlySale ?? o.monthly_sale ?? fallback.currentMonthSale
    ),
    previousAll: readNum(o.previousAll ?? o.previous_all ?? fallback.previousAll),
    previousRent: readNum(o.previousRent ?? o.previous_rent ?? fallback.previousRent),
    previousSale: readNum(o.previousSale ?? o.previous_sale ?? fallback.previousSale),
  };
}

function normalizePropertySummary(payload: unknown): AgentDashboardMetrics['propertySummary'] {
  const fallback = DEFAULT_METRICS_PAYLOAD.propertySummary;
  if (!payload || typeof payload !== 'object') return fallback;
  const o = payload as LooseRecord;
  return {
    totalProperties: readNum(o.totalProperties ?? o.total_properties ?? fallback.totalProperties),
    currentMonthTotalProperties: readNum(
      o.currentMonthTotalProperties ??
        o.current_month_total_properties ??
        o.monthlyTotalProperties ??
        o.monthly_total_properties ??
        fallback.currentMonthTotalProperties
    ),
    previousTotalProperties: readNum(
      o.previousTotalProperties ?? o.previous_total_properties ?? fallback.previousTotalProperties
    ),
    availableProperties: readNum(
      o.availableProperties ?? o.available_properties ?? fallback.availableProperties
    ),
    reservedProperties: readNum(o.reservedProperties ?? o.reserved_properties ?? fallback.reservedProperties),
    soldProperties: readNum(o.soldProperties ?? o.sold_properties ?? fallback.soldProperties),
    rentedProperties: readNum(o.rentedProperties ?? o.rented_properties ?? fallback.rentedProperties),
    draftProperties: readNum(o.draftProperties ?? o.draft_properties ?? fallback.draftProperties),
    pendingProperties: readNum(o.pendingProperties ?? o.pending_properties ?? fallback.pendingProperties),
    verifiedProperties: readNum(
      o.verifiedProperties ?? o.verified_properties ?? fallback.verifiedProperties
    ),
    rejectedProperties: readNum(
      o.rejectedProperties ?? o.rejected_properties ?? fallback.rejectedProperties
    ),
  };
}

function normalizeAppointmentSummary(payload: unknown): AgentDashboardMetrics['appointmentSummary'] {
  const fallback = DEFAULT_METRICS_PAYLOAD.appointmentSummary;
  if (!payload || typeof payload !== 'object') return fallback;
  const o = payload as LooseRecord;
  return {
    totalAppointments: readNum(o.totalAppointments ?? o.total_appointments ?? fallback.totalAppointments),
    currentMonthTotalAppointments: readNum(
      o.currentMonthTotalAppointments ??
        o.current_month_total_appointments ??
        o.monthlyTotalAppointments ??
        o.monthly_total_appointments ??
        fallback.currentMonthTotalAppointments
    ),
    previousTotalAppointments: readNum(
      o.previousTotalAppointments ?? o.previous_total_appointments ?? fallback.previousTotalAppointments
    ),
    pendingAppointments: readNum(
      o.pendingAppointments ?? o.pending_appointments ?? fallback.pendingAppointments
    ),
    acceptedAppointments: readNum(
      o.acceptedAppointments ?? o.accepted_appointments ?? fallback.acceptedAppointments
    ),
    rejectedAppointments: readNum(
      o.rejectedAppointments ?? o.rejected_appointments ?? fallback.rejectedAppointments
    ),
    canceledAppointments: readNum(
      o.canceledAppointments ?? o.canceled_appointments ?? fallback.canceledAppointments
    ),
    completedAppointments: readNum(
      o.completedAppointments ?? o.completed_appointments ?? fallback.completedAppointments
    ),
    upcomingAppointments: readNum(
      o.upcomingAppointments ?? o.upcoming_appointments ?? fallback.upcomingAppointments
    ),
    currentMonthUpcomingAppointments: readNum(
      o.currentMonthUpcomingAppointments ??
        o.current_month_upcoming_appointments ??
        o.monthlyUpcomingAppointments ??
        o.monthly_upcoming_appointments ??
        fallback.currentMonthUpcomingAppointments
    ),
    previousUpcomingAppointments: readNum(
      o.previousUpcomingAppointments ?? o.previous_upcoming_appointments ?? fallback.previousUpcomingAppointments
    ),
  };
}

function normalizeLeadSummary(payload: unknown): AgentDashboardMetrics['crmSummary'] {
  const fallback = DEFAULT_METRICS_PAYLOAD.crmSummary;
  if (!payload || typeof payload !== 'object') return fallback;
  const o = payload as LooseRecord;
  const rawBySource = o.bySource ?? o.by_source;
  const bySource = Array.isArray(rawBySource)
    ? rawBySource
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const e = entry as LooseRecord;
          const source = readStr(e.source);
          if (!source) return null;
          return {
            source,
            count: readNum(e.count),
          };
        })
        .filter((entry): entry is AgentDashboardMetrics['crmSummary']['bySource'][number] => entry !== null)
    : fallback.bySource;
  return {
    totalLeads: readNum(o.totalLeads ?? o.total_leads ?? fallback.totalLeads),
    closedLeads: readNum(o.closedLeads ?? o.closed_leads ?? fallback.closedLeads),
    previousTotalLeads: readNum(
      o.previousTotalLeads ?? o.previous_total_leads ?? fallback.previousTotalLeads
    ),
    previousClosedLeads: readNum(
      o.previousClosedLeads ?? o.previous_closed_leads ?? fallback.previousClosedLeads
    ),
    bySource,
  };
}

function normalizeLeadStatusSummary(payload: unknown): AgentDashboardMetrics['crmStatusSummary'] {
  const fallback = DEFAULT_METRICS_PAYLOAD.crmStatusSummary;
  if (!payload || typeof payload !== 'object') return fallback;
  const o = payload as LooseRecord;
  const rawByStatus = o.byStatus ?? o.by_status;
  const byStatus = Array.isArray(rawByStatus)
    ? rawByStatus
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const e = entry as LooseRecord;
          const status = readStr(e.status);
          if (!status) return null;
          return {
            status,
            count: readNum(e.count),
          };
        })
        .filter(
          (entry): entry is AgentDashboardMetrics['crmStatusSummary']['byStatus'][number] =>
            entry !== null
        )
    : fallback.byStatus;
  return { byStatus };
}

function mapCalendarDayRow(row: unknown): AgentAppointmentCalendarDay | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as LooseRecord;
  const date = readStr(o.date);
  if (!date) return null;
  const tourCount = readNum(o.tourCount ?? o.tour_count);
  const blockCount = readNum(o.blockCount ?? o.block_count);
  const total = readNum(o.total);
  const hasItems =
    readBool(o.hasItems ?? o.has_items) || total > 0 || tourCount > 0 || blockCount > 0;
  return { date, total, tourCount, blockCount, hasItems };
}

function mapRangeRow(row: unknown, fallback: AgentAppointmentCalendarRange): AgentAppointmentCalendarRange {
  if (!row || typeof row !== 'object') return fallback;
  const o = row as LooseRecord;
  const startDate = readStr(o.startDate ?? o.start_date) || fallback.startDate;
  const endDate = readStr(o.endDate ?? o.end_date) || fallback.endDate;
  const timezone = readStr(o.timezone) || fallback.timezone;
  return { startDate, endDate, timezone };
}

function mapAppointmentRow(row: unknown): AppointmentItem | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as LooseRecord;
  const appointmentId = readStr(o.appointmentId ?? o.appointment_id);
  if (!appointmentId) return null;
  return {
    appointmentId,
    listingId: readStr(o.listingId ?? o.listing_id),
    listingName: readStr(o.listingName ?? o.listing_name),
    listingAddress: readStr(o.listingAddress ?? o.listing_address),
    startTime: readStr(o.startTime ?? o.start_time),
    endTime: readStr(o.endTime ?? o.end_time),
    status: readStr(o.status) as AppointmentItem['status'],
    appointmentType: readStr(o.appointmentType ?? o.appointment_type) as AppointmentItem['appointmentType'],
  };
}

/** Accepts camelCase or Jackson SNAKE_CASE wire payloads from `/appointments/dashboard-snapshot`. */
function normalizeAppointmentsSnapshot(snapshot: unknown): AgentAppointmentsSnapshot {
  const fallback = getFallbackAppointmentsSnapshot();
  if (!snapshot || typeof snapshot !== 'object') {
    return fallback;
  }
  const s = snapshot as LooseRecord;
  const rawDays = s.calendarDays ?? s.calendar_days;
  const calendarDays: AgentAppointmentCalendarDay[] = Array.isArray(rawDays)
    ? rawDays.map(mapCalendarDayRow).filter((d): d is AgentAppointmentCalendarDay => d !== null)
    : [];
  const rawAppointments = s.appointments;
  const appointments: AppointmentItem[] = Array.isArray(rawAppointments)
    ? rawAppointments.map(mapAppointmentRow).filter((a): a is AppointmentItem => a !== null)
    : [];
  return {
    range: mapRangeRow(s.range, fallback.range),
    calendarDays,
    appointments,
  };
}

function mapPlanSubscriptionRow(row: unknown): AgentPlanSubscriptionRow | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as LooseRecord;
  const subscriptionId = readStr(o.subscription_id ?? o.subscriptionId);
  const packageCode = readStr(o.package_code ?? o.packageCode);
  const packageName = readStr(o.package_name ?? o.packageName);
  const featureType = readStr(o.feature_type ?? o.featureType);
  const startDate = readStr(o.start_date ?? o.startDate);
  const status = readStr(o.status);
  if (!subscriptionId || !featureType || !status) return null;

  return {
    subscription_id: subscriptionId,
    package_code: packageCode,
    package_name: packageName,
    feature_type: featureType,
    quota_limit: readNullableNum(o.quota_limit ?? o.quotaLimit),
    remaining_quota: readNullableNum(o.remaining_quota ?? o.remainingQuota),
    unlimited: readBool(o.unlimited),
    tier_level: readNum(o.tier_level ?? o.tierLevel),
    start_date: startDate,
    end_date: readStr(o.end_date ?? o.endDate) || null,
    status,
  };
}

function normalizePlanSnapshot(rows: unknown): AgentPlanSnapshot {
  const fallback = DEFAULT_PLAN_SNAPSHOT.data;
  if (!Array.isArray(rows) || rows.length === 0) return fallback;

  const subscriptions = rows
    .map(mapPlanSubscriptionRow)
    .filter((row): row is AgentPlanSubscriptionRow => row !== null)
    .sort((a, b) => {
      const aActive = a.status.toUpperCase() === 'ACTIVE' ? 0 : 1;
      const bActive = b.status.toUpperCase() === 'ACTIVE' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (a.package_name || '').localeCompare(b.package_name || '');
    });

  return { subscriptions };
}

function withDateRange(path: string, range?: AgentDateRange): string {
  if (!range?.from || !range?.to) return path;
  const query = new URLSearchParams({
    from: range.from,
    to: range.to,
  });
  return `${path}?${query.toString()}`;
}

async function getMetricsPayload(range?: AgentDateRange): Promise<AgentDashboardMetrics> {
  const [listingSummary, propertySummary, appointmentSummary, crmSummary, crmStatusSummary] =
    await Promise.all([
    safeGet('/listings/managed-listings/summary', DEFAULT_METRICS_PAYLOAD.listingSummary),
    safeGet('/properties/me/summary', DEFAULT_METRICS_PAYLOAD.propertySummary),
    safeGet('/appointments/summary', DEFAULT_METRICS_PAYLOAD.appointmentSummary),
    safeGet(withDateRange('/crm/leads/summary', range), DEFAULT_METRICS_PAYLOAD.crmSummary),
    safeGet(
      withDateRange('/crm/leads/status-summary', range),
      DEFAULT_METRICS_PAYLOAD.crmStatusSummary
    ),
  ]);

  return {
    listingSummary: normalizeListingSummary(listingSummary),
    propertySummary: normalizePropertySummary(propertySummary),
    appointmentSummary: normalizeAppointmentSummary(appointmentSummary),
    crmSummary: normalizeLeadSummary(crmSummary),
    crmStatusSummary: normalizeLeadStatusSummary(crmStatusSummary),
  };
}

export const agentDashboardApi = {
  getMetrics: async (range?: AgentDateRange): Promise<AgentDashboardMetricsResponse> => {
    const payload = await getMetricsPayload(range);
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
    const rows = await safeGet<AgentPlanSubscriptionRow[]>('/billing/subscriptions/me', []);
    const data = normalizePlanSnapshot(rows);

    return {
      success: true,
      message: 'Agent plan snapshot fetched.',
      timestamp: new Date().toISOString(),
      data,
    };
  },
};
