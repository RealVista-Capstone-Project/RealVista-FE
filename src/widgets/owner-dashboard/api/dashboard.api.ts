import http from '@/shared/lib/http';
import type {
  DashboardApiResponse,
  DashboardStatsResponse,
  PerformancePeriod,
  PerformanceMetric,
  PerformanceResponse,
  FeaturedPropertyDTO,
  SalesAnalyticsResponse,
  SalesAnalyticsPeriod,
  DashboardAgentDTO,
  DashboardScheduleResponse,
  ScheduleType,
  PropertyOverviewResponse,
  DashboardPropertiesQuery,
  PropertyFilterStatus,
  PageResponse,
  DashboardPropertyItemDTO,
} from './dashboard.api.types';

const DASHBOARD_BASE = '/dashboard';

function appendIfPresent(searchParams: URLSearchParams, key: string, value: unknown) {
  if (value !== undefined && value !== null && value !== '') {
    searchParams.set(key, String(value));
  }
}

const statusToApiValue: Record<Exclude<PropertyFilterStatus, 'All'>, 'PUBLISHED' | 'RENTED' | 'SOLD'> = {
  Available: 'PUBLISHED',
  Occupied: 'RENTED',
  'Sold Out': 'SOLD',
};

export function mapBackendStatusToUiStatus(status: string): Exclude<PropertyFilterStatus, 'All'> {
  if (status === 'PUBLISHED') return 'Available';
  if (status === 'RENTED') return 'Occupied';
  if (status === 'SOLD') return 'Sold Out';
  return 'Available';
}

export const ownerDashboardApi = {
  async getStats() {
    const response = await http.get<DashboardApiResponse<any>>(`${DASHBOARD_BASE}/stats`);
    const data = response.payload.data;

    if (!data) return data;

    // The backend uses Jackson SNAKE_CASE strategy, so we map snake_case to camelCase
    return {
      totalRevenue: data.totalRevenue ?? data.total_revenue,
      totalRevenueTrend: data.totalRevenueTrend ?? data.total_revenue_trend,
      activeListing: data.activeListing ?? data.active_listing,
      activeListingTrend: data.activeListingTrend ?? data.active_listing_trend,
      totalClosed: data.totalClosed ?? data.total_closed,
      totalClosedTrend: data.totalClosedTrend ?? data.total_closed_trend,
      activeLeads: data.activeLeads ?? data.active_leads,
      activeLeadsTrend: data.activeLeadsTrend ?? data.active_leads_trend,
      onProgress: data.onProgress ?? data.on_progress,
      closedDeals: data.closedDeals ?? data.closed_deals,
    } as DashboardStatsResponse;
  },

  async getPerformance(params?: { period?: PerformancePeriod; metric?: PerformanceMetric }) {
    const searchParams = new URLSearchParams();
    appendIfPresent(searchParams, 'period', params?.period ?? 'M');
    appendIfPresent(searchParams, 'metric', params?.metric ?? 'revenue');

    const response = await http.get<DashboardApiResponse<PerformanceResponse>>(
      `${DASHBOARD_BASE}/performance?${searchParams.toString()}`,
    );
    return response.payload.data;
  },

  async getFeaturedProperty() {
    const response = await http.get<DashboardApiResponse<any>>(
      `${DASHBOARD_BASE}/featured-property`,
    );
    const data = response.payload.data;
    if (!data) return data;

    return {
      listingId: data.listingId ?? data.listing_id,
      name: data.name,
      type: data.type,
      sold: data.sold,
      rented: data.rented,
      views: data.views,
      status: data.status,
    } as FeaturedPropertyDTO;
  },

  async getSalesAnalytics(period: SalesAnalyticsPeriod = 'month') {
    const response = await http.get<DashboardApiResponse<SalesAnalyticsResponse>>(
      `${DASHBOARD_BASE}/sales-analytics?period=${period}`,
    );
    return response.payload.data;
  },

  async getAgents(limit: number = 4) {
    const response = await http.get<DashboardApiResponse<any>>(
      `${DASHBOARD_BASE}/agents?limit=${limit}`,
    );
    const data = response.payload.data;
    if (!Array.isArray(data)) return data;

    return data.map((a: any) => ({
      userId: a.userId ?? a.user_id,
      fullName: a.fullName ?? a.full_name,
      avatarUrl: a.avatarUrl ?? a.avatar_url,
      phone: a.phone,
      activeLeads: a.activeLeads ?? a.active_leads,
      leadBadge: a.leadBadge ?? a.lead_badge,
    })) as DashboardAgentDTO[];
  },

  async getSchedules(params?: { date?: string; type?: ScheduleType }) {
    const searchParams = new URLSearchParams();
    appendIfPresent(searchParams, 'date', params?.date);
    appendIfPresent(searchParams, 'type', params?.type ?? 'all');

    const response = await http.get<DashboardApiResponse<DashboardScheduleResponse>>(
      `${DASHBOARD_BASE}/schedules?${searchParams.toString()}`,
    );
    return response.payload.data;
  },

  async getPropertyOverview() {
    const response = await http.get<DashboardApiResponse<any>>(
      `${DASHBOARD_BASE}/properties/overview`,
    );
    const data = response.payload.data;
    if (!data) return data;

    return {
      total: data.total,
      listed: data.listed,
      listedPercent: data.listedPercent ?? data.listed_percent,
      sold: data.sold,
      soldPercent: data.soldPercent ?? data.sold_percent,
      activeListings: (data.activeListings ?? data.active_listings ?? []).map((l: any) => ({
        listingId: l.listingId ?? l.listing_id,
        name: l.name,
        address: l.address,
        leadCount: l.leadCount ?? l.lead_count,
      })),
    } as PropertyOverviewResponse;
  },

  async getProperties(query?: DashboardPropertiesQuery) {
    const searchParams = new URLSearchParams();

    appendIfPresent(searchParams, 'search', query?.search);

    if (query?.status && query.status !== 'All') {
      appendIfPresent(searchParams, 'status', statusToApiValue[query.status]);
    }

    appendIfPresent(searchParams, 'page', query?.page ?? 0);
    appendIfPresent(searchParams, 'size', query?.size ?? 10);
    appendIfPresent(searchParams, 'sortBy', query?.sortBy ?? 'cost');
    appendIfPresent(searchParams, 'sortDir', query?.sortDir ?? 'desc');

    const response = await http.get<DashboardApiResponse<PageResponse<DashboardPropertyItemDTO>>>(
      `${DASHBOARD_BASE}/properties?${searchParams.toString()}`,
    );

    return response.payload.data;
  },
};
