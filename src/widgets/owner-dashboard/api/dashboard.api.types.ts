export type DashboardApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export interface DashboardStatsResponse {
  totalRevenue: number;
  totalRevenueTrend: number;
  activeListing: number;
  activeListingTrend: number;
  totalClosed: number;
  totalClosedTrend: number;
  activeLeads: number;
  activeLeadsTrend: number;
  onProgress: number;
  closedDeals: number;
}

export type PerformancePeriod = 'W' | 'M' | 'Y';
export type PerformanceMetric = 'revenue' | 'visit';

export interface PerformanceDataPoint {
  label: string;
  value: number;
}

export interface PerformanceResponse {
  period: PerformancePeriod;
  metric: PerformanceMetric;
  data: PerformanceDataPoint[];
}

export interface FeaturedPropertyDTO {
  listingId: string;
  name: string;
  type: string;
  sold: number;
  rented: number;
  views: number;
  status: 'PUBLISHED' | 'RENTED' | 'SOLD' | string;
}

export type SalesAnalyticsPeriod = 'month' | 'quarter' | 'year';

export interface SalesChannelStats {
  count: number;
  value: number;
}

export interface SalesAnalyticsResponse {
  period: SalesAnalyticsPeriod;
  direct: SalesChannelStats;
  agent: SalesChannelStats;
  total: SalesChannelStats;
}

export interface DashboardAgentDTO {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  activeLeads: number;
  leadBadge?: 'new' | 'warm' | 'hot';
}

export type ScheduleType = 'all' | 'mySchedule' | 'assigned';

export interface DashboardScheduleItem {
  appointmentId: string;
  title: string;
  address: string;
  date: string;
  time: string;
  type: 'mySchedule' | 'assigned';
  status: string;
}

export interface DashboardScheduleResponse {
  date: string;
  type: ScheduleType;
  items: DashboardScheduleItem[];
}

export interface ActiveListingOverview {
  listingId: string;
  name: string;
  address: string;
  leadCount: number;
}

export interface PropertyOverviewResponse {
  total: number;
  listed: number;
  listedPercent: number;
  sold: number;
  soldPercent: number;
  activeListings: ActiveListingOverview[];
}

export type PropertyFilterStatus = 'All' | 'Available' | 'Occupied' | 'Sold Out';

export interface DashboardPropertyItemDTO {
  listingId: string;
  name: string;
  type: string;
  cost: number;
  activeLeads: number;
  views: number;
  status: 'PUBLISHED' | 'RENTED' | 'SOLD' | string;
  listingType: 'SALE' | 'RENT' | string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface DashboardPropertiesQuery {
  search?: string;
  status?: PropertyFilterStatus;
  page?: number;
  size?: number;
  sortBy?: 'cost' | 'leads' | 'views';
  sortDir?: 'asc' | 'desc';
}
