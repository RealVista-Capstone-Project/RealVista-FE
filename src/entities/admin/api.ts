import http from '@/shared/lib/http';
import { ApiResponse } from '@/shared/types/api';

export interface AdminOverview {
  total_users: number;
  total_revenue: number;
  pending_listings: number;
  unresolved_reports: number;
  total_listings: number;
  total_boosts: number;
  listings_created_today: number;
}


export interface AdminStats {
  user_growth: { label: string; value: number }[];
  listing_status: { label: string; value: number }[];
  revenue_trend: { label: string; value: number; extra?: Record<string, number> }[];
  top_listings: {
    id: string;
    title: string;
    thumbnail_url?: string;
    views: number;
    interactions: number;
    revenue: number;
    trend: string;
  }[];
  package_insights: { id: string; label: string; value: number; extra?: Record<string, number> }[];
  top_agents: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    listing_count: number;
    revenue_generated: number;
  }[];
  recent_activities: {
    id: string;
    type: 'USER' | 'LISTING' | 'REPORT' | 'TRANSACTION';
    description: string;
    status: string;
    timestamp: string;
    target_id: string;
  }[];
  system_health: Record<string, number>;
}

export const adminApi = {
  getOverview: (startDate?: string, endDate?: string) => {
    let url = '/admin/overview';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return http.get<ApiResponse<AdminOverview>>(url).then((res) => res.payload.data);
  },
  getStats: (startDate?: string, endDate?: string) => {
    let url = '/admin/stats';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return http.get<ApiResponse<AdminStats>>(url).then((res) => res.payload.data);
  },
};

export const adminQueries = {
  overview: (startDate?: string, endDate?: string) => ({
    queryKey: ['admin', 'overview', startDate, endDate],
    queryFn: () => adminApi.getOverview(startDate, endDate),
  }),
  stats: (startDate?: string, endDate?: string) => ({
    queryKey: ['admin', 'stats', startDate, endDate],
    queryFn: () => adminApi.getStats(startDate, endDate),
  }),
};
