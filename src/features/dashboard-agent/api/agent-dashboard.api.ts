import { env } from '@/shared/lib/env';
import type {
  AgentAppointmentsSnapshotResponse,
  AgentDashboardMetricsResponse,
  AgentPerformanceMetricsResponse,
  AgentPlanSnapshotResponse,
} from '../model/agent-dashboard.types';
import {
  mockAgentAppointmentsSnapshot,
  mockAgentDashboardMetrics,
  mockAgentPerformanceMetrics,
  mockAgentPlanSnapshot,
} from '../model/agent-dashboard.mocks';

const SIMULATED_NETWORK_DELAY_MS = 180;

async function withDelay<T>(payload: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_NETWORK_DELAY_MS));
  return payload;
}

export const agentDashboardApi = {
  getMetrics: async (): Promise<AgentDashboardMetricsResponse> => {
    void env.NEXT_PUBLIC_API_ENDPOINT;
    // Next integration target: GET /api/v1/listings/managed-listings/summary + crm summary aggregate.
    return withDelay(mockAgentDashboardMetrics);
  },
  getPerformance: async (): Promise<AgentPerformanceMetricsResponse> => {
    // Next integration target: listing analytics + engagement/channel conversion endpoints.
    return withDelay(mockAgentPerformanceMetrics);
  },
  getAppointmentsSnapshot: async (): Promise<AgentAppointmentsSnapshotResponse> => {
    // Next integration target: GET /api/v1/appointments
    return withDelay(mockAgentAppointmentsSnapshot);
  },
  getPlanSnapshot: async (): Promise<AgentPlanSnapshotResponse> => {
    // Next integration target: GET /api/v1/billing/subscriptions/me + boosts/me.
    return withDelay(mockAgentPlanSnapshot);
  },
};
