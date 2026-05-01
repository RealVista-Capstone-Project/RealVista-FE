import { useQuery } from '@tanstack/react-query';
import { agentDashboardApi } from './agent-dashboard.api';
import type {
  AgentDateRange,
  AgentListingAnalyticsSort,
  AgentPerformancePeriod,
} from '../model/agent-dashboard.types';

const agentDashboardKeys = {
  all: ['agent-dashboard'] as const,
  metrics: (range?: AgentDateRange) =>
    [...agentDashboardKeys.all, 'metrics', range?.from ?? null, range?.to ?? null] as const,
  performance: (period: AgentPerformancePeriod) => [...agentDashboardKeys.all, 'performance', period] as const,
  topListings: (sortBy: AgentListingAnalyticsSort) =>
    [...agentDashboardKeys.all, 'top-listings', sortBy] as const,
  appointments: () => [...agentDashboardKeys.all, 'appointments'] as const,
  plan: () => [...agentDashboardKeys.all, 'plan'] as const,
};

export function useAgentDashboardMetrics(range?: AgentDateRange) {
  return useQuery({
    queryKey: agentDashboardKeys.metrics(range),
    queryFn: () => agentDashboardApi.getMetrics(range),
    staleTime: 60 * 1000,
  });
}

export function useAgentPerformanceMetrics(period: AgentPerformancePeriod) {
  return useQuery({
    queryKey: agentDashboardKeys.performance(period),
    queryFn: () => agentDashboardApi.getPerformance(period),
    staleTime: 60 * 1000,
  });
}

export function useAgentTopListings(sortBy: AgentListingAnalyticsSort) {
  return useQuery({
    queryKey: agentDashboardKeys.topListings(sortBy),
    queryFn: () => agentDashboardApi.getTopListings(sortBy),
    staleTime: 60 * 1000,
  });
}

export function useAgentAppointmentsSnapshot() {
  return useQuery({
    queryKey: agentDashboardKeys.appointments(),
    queryFn: agentDashboardApi.getAppointmentsSnapshot,
    staleTime: 60 * 1000,
  });
}

export function useAgentPlanSnapshot() {
  return useQuery({
    queryKey: agentDashboardKeys.plan(),
    queryFn: agentDashboardApi.getPlanSnapshot,
    staleTime: 60 * 1000,
  });
}
