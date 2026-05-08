import http from '@/shared/lib/http';
import type {
  DashboardApiResponse,
  DashboardStatsResponse,
  OwnerHeroInsightsResponse,
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
    const response = await http.get<DashboardApiResponse<DashboardStatsResponse>>(`${DASHBOARD_BASE}/stats`);
    return response.payload.data;
  },

  async getHeroInsights() {
    const response = await http.get<DashboardApiResponse<OwnerHeroInsightsResponse>>(
      `${DASHBOARD_BASE}/hero-insights`,
    );
    return response.payload.data;
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
    const response = await http.get<DashboardApiResponse<FeaturedPropertyDTO>>(
      `${DASHBOARD_BASE}/featured-property`,
    );
    return response.payload.data;
  },

  async getSalesAnalytics(period: SalesAnalyticsPeriod = 'month') {
    const response = await http.get<DashboardApiResponse<SalesAnalyticsResponse>>(
      `${DASHBOARD_BASE}/sales-analytics?period=${period}`,
    );
    return response.payload.data;
  },

  async getAgents(limit: number = 4) {
    const response = await http.get<DashboardApiResponse<DashboardAgentDTO[]>>(
      `${DASHBOARD_BASE}/agents?limit=${limit}`,
    );
    return response.payload.data;
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
    const response = await http.get<DashboardApiResponse<PropertyOverviewResponse>>(
      `${DASHBOARD_BASE}/properties/overview`,
    );
    return response.payload.data;
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
