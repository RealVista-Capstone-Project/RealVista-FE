import type {
  AgentAppointmentsSnapshotResponse,
  AgentDashboardMetricsResponse,
  AgentPerformanceMetricsResponse,
  AgentPlanSnapshotResponse,
} from './agent-dashboard.types';

const nowIso = new Date().toISOString();

export const mockAgentDashboardMetrics: AgentDashboardMetricsResponse = {
  success: true,
  message: 'Agent dashboard metrics fetched.',
  timestamp: nowIso,
  data: {
    kpis: [
      { id: 'active-listings', label: 'Active Listings', value: 24, deltaPercent: 8.6, trend: 'up' },
      {
        id: 'delegated-properties',
        label: 'Delegated Properties',
        value: 12,
        deltaPercent: 4.2,
        trend: 'up',
      },
      {
        id: 'open-appointments',
        label: 'Open Appointments',
        value: 17,
        deltaPercent: 2.9,
        trend: 'down',
      },
      { id: 'crm-leads', label: 'CRM Leads', value: 68, deltaPercent: 12.4, trend: 'up' },
    ],
  },
};

export const mockAgentPerformanceMetrics: AgentPerformanceMetricsResponse = {
  success: true,
  message: 'Agent performance metrics fetched.',
  timestamp: nowIso,
  data: {
    trend: [
      { month: 'Jan', views: 900, inquiries: 160, closedDeals: 8 },
      { month: 'Feb', views: 1040, inquiries: 172, closedDeals: 9 },
      { month: 'Mar', views: 1210, inquiries: 198, closedDeals: 11 },
      { month: 'Apr', views: 1460, inquiries: 220, closedDeals: 13 },
      { month: 'May', views: 1600, inquiries: 248, closedDeals: 15 },
      { month: 'Jun', views: 1760, inquiries: 260, closedDeals: 17 },
    ],
    channels: [
      { channel: 'Website', leads: 36, conversionRate: 26 },
      { channel: 'Social', leads: 24, conversionRate: 18 },
      { channel: 'Referrals', leads: 16, conversionRate: 34 },
      { channel: 'Walk-in', leads: 10, conversionRate: 14 },
    ],
  },
};

export const mockAgentAppointmentsSnapshot: AgentAppointmentsSnapshotResponse = {
  success: true,
  message: 'Agent appointments fetched.',
  timestamp: nowIso,
  data: {
    appointments: [
      {
        id: 'app-1',
        title: 'Property tour with Michael Reynolds',
        location: '742 Oak Street, Denver',
        startsAt: '2026-05-02T09:00:00.000Z',
        status: 'confirmed',
      },
      {
        id: 'app-2',
        title: 'Follow-up call with Olivia Chen',
        location: 'Online meeting',
        startsAt: '2026-05-02T13:30:00.000Z',
        status: 'pending',
      },
      {
        id: 'app-3',
        title: 'Open-house prep for Somerset',
        location: 'The Somerset, New York',
        startsAt: '2026-05-03T08:00:00.000Z',
        status: 'confirmed',
      },
    ],
  },
};

export const mockAgentPlanSnapshot: AgentPlanSnapshotResponse = {
  success: true,
  message: 'Agent plan snapshot fetched.',
  timestamp: nowIso,
  data: {
    planName: 'Pro Agent',
    renewsAt: '2026-06-20T00:00:00.000Z',
    listingQuotaUsed: 18,
    listingQuotaTotal: 30,
    boostsUsed: 7,
    boostsTotal: 12,
  },
};
