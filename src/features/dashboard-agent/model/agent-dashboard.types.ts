import type { ApiResponse } from '@/shared/types/api-response';

export type AgentPerformancePeriod = 'W' | 'M' | 'Y';

export interface AgentDateRange {
  from: string;
  to: string;
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

export interface ManagedListingSummary {
  all: number;
  rent: number;
  sale: number;
  currentMonthAll: number;
  currentMonthRent: number;
  currentMonthSale: number;
  previousAll: number;
  previousRent: number;
  previousSale: number;
}

export interface PropertySummaryMetrics {
  totalProperties: number;
  currentMonthTotalProperties: number;
  previousTotalProperties: number;
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
  currentMonthTotalAppointments: number;
  previousTotalAppointments: number;
  pendingAppointments: number;
  acceptedAppointments: number;
  rejectedAppointments: number;
  canceledAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  currentMonthUpcomingAppointments: number;
  previousUpcomingAppointments: number;
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

export interface LeadStatusSummary {
  status: string;
  count: number;
}

export interface LeadStatusSummaryMetrics {
  byStatus: LeadStatusSummary[];
}

export interface AppointmentItem {
  appointmentId: string;
  listingId: string;
  listingName: string;
  listingAddress: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED';
  appointmentType: 'TOUR' | 'BLOCK';
}

export interface AgentAppointmentCalendarDay {
  date: string;
  total: number;
  tourCount: number;
  blockCount: number;
  hasItems: boolean;
}

export interface AgentAppointmentCalendarRange {
  startDate: string;
  endDate: string;
  timezone: string;
}

export type AgentAppointmentTabFilter = 'all' | 'tour' | 'block';

export interface AgentAppointmentsSnapshot {
  range: AgentAppointmentCalendarRange;
  calendarDays: AgentAppointmentCalendarDay[];
  appointments: AppointmentItem[];
}

export interface AgentPlanSnapshot {
  subscriptions: AgentPlanSubscriptionRow[];
  boosts: AgentPlanBoostRow[];
}

export interface AgentPlanSubscriptionRow {
  subscription_id: string;
  package_code: string;
  package_name: string;
  feature_type: string;
  quota_limit?: number | null;
  remaining_quota: number | null;
  unlimited: boolean;
  tier_level?: number;
  start_date: string;
  end_date?: string | null;
  status: string;
}

export interface AgentPlanBoostRow {
  boost_package_id: string;
  code: string;
  name: string;
  description: string;
  featured_quota: number;
  hot_badge_quota: number;
  duration_days: number;
  start_date: string;
  end_date: string | null;
  remaining_featured_quota: number | null;
  remaining_hot_badge_quota: number | null;
  status: string;
}

export interface AgentDashboardMetrics {
  listingSummary: ManagedListingSummary;
  propertySummary: PropertySummaryMetrics;
  appointmentSummary: AppointmentSummaryMetrics;
  crmSummary: LeadSummaryMetrics;
  crmStatusSummary: LeadStatusSummaryMetrics;
}

export interface AgentPerformanceMetrics {
  period?: AgentPerformancePeriod;
  trend: AgentPerformancePoint[];
  channels: AgentChannelPerformanceItem[];
}

export type AgentDashboardMetricsResponse = ApiResponse<AgentDashboardMetrics>;
export type AgentPerformanceMetricsResponse = ApiResponse<AgentPerformanceMetrics>;
export type AgentAppointmentsSnapshotResponse = ApiResponse<AgentAppointmentsSnapshot>;
export type AgentPlanSnapshotResponse = ApiResponse<AgentPlanSnapshot>;

export type AgentListingAnalyticsSort = 'views' | 'inquiries' | 'tours';

export interface AgentListingAnalyticsRow {
  listingId: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  listingType: 'RENT' | 'SALE';
  status: string;
  price: number | null;
  fullAddress: string;
  publishedAt: string | null;
  totalViews: number;
  uniqueViewers: number;
  tourBookings: number;
  inquiries: number;
  conversionRate: number;
}

export type AgentTopListingsResponse = ApiResponse<AgentListingAnalyticsRow[]>;
