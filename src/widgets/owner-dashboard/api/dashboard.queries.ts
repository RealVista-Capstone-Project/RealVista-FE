import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ownerDashboardApi } from './dashboard.api';
import type {
  DashboardPropertiesQuery,
  PerformanceMetric,
  PerformancePeriod,
  SalesAnalyticsPeriod,
  ScheduleType,
} from './dashboard.api.types';

export const ownerDashboardKeys = {
  all: ['owner-dashboard'] as const,
  stats: () => [...ownerDashboardKeys.all, 'stats'] as const,
  performance: (period: PerformancePeriod, metric: PerformanceMetric) =>
    [...ownerDashboardKeys.all, 'performance', period, metric] as const,
  featuredProperty: () => [...ownerDashboardKeys.all, 'featured-property'] as const,
  salesAnalytics: (period: SalesAnalyticsPeriod) =>
    [...ownerDashboardKeys.all, 'sales-analytics', period] as const,
  agents: (limit: number) => [...ownerDashboardKeys.all, 'agents', limit] as const,
  schedules: (date: string, type: ScheduleType) =>
    [...ownerDashboardKeys.all, 'schedules', date, type] as const,
  propertyOverview: () => [...ownerDashboardKeys.all, 'property-overview'] as const,
  properties: (query: DashboardPropertiesQuery) => [...ownerDashboardKeys.all, 'properties', query] as const,
} as const;

export function useDashboardStats() {
  return useQuery({
    queryKey: ownerDashboardKeys.stats(),
    queryFn: () => ownerDashboardApi.getStats(),
    staleTime: 30 * 1000,
  });
}

export function useDashboardPerformance(period: PerformancePeriod, metric: PerformanceMetric) {
  return useQuery({
    queryKey: ownerDashboardKeys.performance(period, metric),
    queryFn: () => ownerDashboardApi.getPerformance({ period, metric }),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useFeaturedProperty() {
  return useQuery({
    queryKey: ownerDashboardKeys.featuredProperty(),
    queryFn: () => ownerDashboardApi.getFeaturedProperty(),
    staleTime: 30 * 1000,
  });
}

export function useSalesAnalytics(period: SalesAnalyticsPeriod = 'month') {
  return useQuery({
    queryKey: ownerDashboardKeys.salesAnalytics(period),
    queryFn: () => ownerDashboardApi.getSalesAnalytics(period),
    staleTime: 30 * 1000,
  });
}

export function useDashboardAgents(limit: number = 4) {
  return useQuery({
    queryKey: ownerDashboardKeys.agents(limit),
    queryFn: () => ownerDashboardApi.getAgents(limit),
    staleTime: 30 * 1000,
  });
}

export function useDashboardSchedules(params: { date: string; type: ScheduleType }) {
  return useQuery({
    queryKey: ownerDashboardKeys.schedules(params.date, params.type),
    queryFn: () => ownerDashboardApi.getSchedules(params),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function usePropertyOverview() {
  return useQuery({
    queryKey: ownerDashboardKeys.propertyOverview(),
    queryFn: () => ownerDashboardApi.getPropertyOverview(),
    staleTime: 30 * 1000,
  });
}

export function useDashboardProperties(query: DashboardPropertiesQuery) {
  return useQuery({
    queryKey: ownerDashboardKeys.properties(query),
    queryFn: () => ownerDashboardApi.getProperties(query),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
