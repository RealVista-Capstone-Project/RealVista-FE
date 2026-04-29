import { useQuery } from '@tanstack/react-query';
import { agentDashboardApi } from './agent-dashboard.api';

const agentDashboardKeys = {
  all: ['agent-dashboard'] as const,
  metrics: () => [...agentDashboardKeys.all, 'metrics'] as const,
  performance: () => [...agentDashboardKeys.all, 'performance'] as const,
  appointments: () => [...agentDashboardKeys.all, 'appointments'] as const,
  plan: () => [...agentDashboardKeys.all, 'plan'] as const,
};

export function useAgentDashboardMetrics() {
  return useQuery({
    queryKey: agentDashboardKeys.metrics(),
    queryFn: agentDashboardApi.getMetrics,
    staleTime: 60 * 1000,
  });
}

export function useAgentPerformanceMetrics() {
  return useQuery({
    queryKey: agentDashboardKeys.performance(),
    queryFn: agentDashboardApi.getPerformance,
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
