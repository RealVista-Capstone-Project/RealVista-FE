import http from '@/shared/lib/http';
import { ApiResponse, PagedResponse } from '@/shared/types/api';

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
export type ReportTargetType = 'LISTING' | 'USER';

export interface Report {
  report_id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  report_target_id: string;
  report_target_type: ReportTargetType;
  reported_listing_name?: string;
  reported_user_name?: string;
  report_reason: string;
  description: string;
  evidence_media_url?: string;
  status: ReportStatus;
  admin_note?: string;
  created_at: string;
  resolved_at?: string;
}

export interface CreateReportPayload {
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description?: string;
  evidence_media_url?: string;
}

export type ReportReason =
  | 'SCAM'
  | 'FAKE_INFO'
  | 'DUPLICATE'
  | 'HARASSMENT'
  | 'SPAM'
  | 'MISLEADING'
  | 'INAPPROPRIATE'
  | 'WRONG_INFO'
  | 'FAKE_PROFILE'
  | 'VIOLATES_TERMS'
  | 'OTHER';

export const LISTING_REPORT_REASONS: ReportReason[] = [
  'SCAM',
  'FAKE_INFO',
  'DUPLICATE',
  'WRONG_INFO',
  'MISLEADING',
  'SPAM',
  'INAPPROPRIATE',
  'VIOLATES_TERMS',
  'HARASSMENT',
  'OTHER',
];

export const USER_REPORT_REASONS: ReportReason[] = [
  'SCAM',
  'FAKE_PROFILE',
  'HARASSMENT',
  'SPAM',
  'INAPPROPRIATE',
  'VIOLATES_TERMS',
  'FAKE_INFO',
  'MISLEADING',
  'OTHER',
];

export const reportApi = {
  submit: (payload: CreateReportPayload) =>
    http.post<ApiResponse<Report>>('/reports', payload),

  getPaged: (params: {
    page: number;
    size: number;
    status?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams({
      page: params.page.toString(),
      size: params.size.toString(),
      ...(params.status && { status: params.status }),
      ...(params.search && { search: params.search }),
    }).toString();
    return http.get<ApiResponse<PagedResponse<Report>>>(`/admin/reports?${query}`);
  },
  getById: (id: string) => http.get<ApiResponse<Report>>(`/admin/reports/${id}`),

  startReview: (id: string) => http.post<ApiResponse<void>>(`/admin/reports/${id}/review`, {}),

  resolve: (id: string, note: string) =>
    http.post<ApiResponse<void>>(`/admin/reports/${id}/resolve`, { admin_note: note }),

  dismiss: (id: string, note: string) =>
    http.post<ApiResponse<void>>(`/admin/reports/${id}/dismiss`, { admin_note: note }),
};
