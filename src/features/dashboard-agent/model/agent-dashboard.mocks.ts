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
    listingSummary: { all: 24, rent: 11, sale: 13 },
    propertySummary: {
      totalProperties: 12,
      availableProperties: 6,
      reservedProperties: 2,
      soldProperties: 2,
      rentedProperties: 1,
      draftProperties: 0,
      pendingProperties: 1,
      verifiedProperties: 0,
      rejectedProperties: 0,
    },
    appointmentSummary: {
      totalAppointments: 17,
      pendingAppointments: 7,
      acceptedAppointments: 6,
      rejectedAppointments: 1,
      canceledAppointments: 1,
      completedAppointments: 2,
      upcomingAppointments: 13,
    },
    crmSummary: {
      totalLeads: 68,
      closedLeads: 19,
      previousTotalLeads: 56,
      previousClosedLeads: 14,
      bySource: [
        { source: 'CHAT', count: 24 },
        { source: 'TOUR', count: 28 },
        { source: 'MANUAL', count: 16 },
      ],
    },
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
        appointmentId: 'app-1',
        listingId: 'listing-1',
        listingName: 'Property tour with Michael Reynolds',
        listingAddress: '742 Oak Street, Denver',
        startTime: '2026-05-02T09:00:00.000Z',
        status: 'ACCEPTED',
      },
      {
        appointmentId: 'app-2',
        listingId: 'listing-2',
        listingName: 'Follow-up call with Olivia Chen',
        listingAddress: 'Online meeting',
        startTime: '2026-05-02T13:30:00.000Z',
        status: 'PENDING',
      },
      {
        appointmentId: 'app-3',
        listingId: 'listing-3',
        listingName: 'Open-house prep for Somerset',
        listingAddress: 'The Somerset, New York',
        startTime: '2026-05-03T08:00:00.000Z',
        status: 'COMPLETED',
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
