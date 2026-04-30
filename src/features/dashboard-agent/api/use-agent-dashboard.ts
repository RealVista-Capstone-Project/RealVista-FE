import { useQuery } from '@tanstack/react-query';
import { agentDashboardApi } from './agent-dashboard.api';
import type { AgentPerformancePeriod } from '../model/agent-dashboard.types';

const agentDashboardKeys = {
  all: ['agent-dashboard'] as const,
  metrics: () => [...agentDashboardKeys.all, 'metrics'] as const,
  performance: (period: AgentPerformancePeriod) => [...agentDashboardKeys.all, 'performance', period] as const,
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

export function useAgentPerformanceMetrics(period: AgentPerformancePeriod) {
  return useQuery({
    queryKey: agentDashboardKeys.performance(period),
    queryFn: () => agentDashboardApi.getPerformance(period),
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
