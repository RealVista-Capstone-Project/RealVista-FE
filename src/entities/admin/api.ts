import http from '@/shared/lib/http';
import { ApiResponse } from '@/shared/types/api';

export interface AdminOverview {
  total_users: number;
  total_revenue: number;
  pending_listings: number;
  unresolved_reports: number;
  total_listings: number;
}


export interface AdminStats {
  user_growth: { label: string; value: number }[];
  listing_status: { label: string; value: number }[];
  revenue_trend: { label: string; value: number }[];
  top_agents: { label: string; value: number }[];
  recent_activities: {
    id: string;
    type: 'USER' | 'LISTING' | 'REPORT' | 'TRANSACTION';
    description: string;
    status: string;
    timestamp: string;
    target_id: string;
  }[];
  top_urgent_reports: {
    id: string;
    type: 'REPORT';
    description: string;
    status: string;
    timestamp: string;
    target_id: string;
  }[];
  system_health: Record<string, number>;
}

export const adminApi = {
  getOverview: () => http.get<ApiResponse<AdminOverview>>('/admin/overview').then((res) => res.payload.data),
  getStats: () => http.get<ApiResponse<AdminStats>>('/admin/stats').then((res) => res.payload.data),
};

export const adminQueries = {
  overview: () => ({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminApi.getOverview(),
  }),
  stats: () => ({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
  }),
};
