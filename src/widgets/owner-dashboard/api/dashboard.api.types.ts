export type DashboardApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export interface DashboardStatsResponse {
  total_revenue: number;
  total_revenue_trend: number;
  active_listing: number;
  active_listing_trend: number;
  total_closed: number;
  total_closed_trend: number;
  active_leads: number;
  active_leads_trend: number;
  on_progress: number;
  closed_deals: number;
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
  listing_id: string;
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
  user_id: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  active_leads: number;
  lead_badge?: 'new' | 'warm' | 'hot';
}

export type ScheduleType = 'all' | 'mySchedule' | 'assigned';

export interface DashboardScheduleItem {
  appointment_id: string;
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
  listing_id: string;
  name: string;
  address: string;
  lead_count: number;
}

export interface PropertyOverviewResponse {
  total: number;
  listed: number;
  listed_percent: number;
  sold: number;
  sold_percent: number;
  active_listings: ActiveListingOverview[];
}

export type PropertyFilterStatus = 'All' | 'Available' | 'Occupied' | 'Sold Out';

export interface DashboardPropertyItemDTO {
  listing_id: string;
  name: string;
  type: string;
  cost: number;
  active_leads: number;
  views: number;
  status: 'PUBLISHED' | 'RENTED' | 'SOLD' | string;
  listing_type: 'SALE' | 'RENT' | string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
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
