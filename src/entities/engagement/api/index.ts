import http from '@/shared/lib/http';
import { ApiResponse } from '@/shared/types/api-response';
import { Engagement } from '../model/types';
import { mapToEngagement } from '../lib/engagement.mapper';

const BASE_URL = '/engagements';

const authHeader = (accessToken: string) => ({
  headers: { Authorization: `Bearer ${accessToken}` },
});

export const engagementApi = {
  /** Pass accessToken so the first request is not sent before getAuthTokenSync() is populated. */
  getMyEngagements: async (accessToken: string): Promise<Engagement[]> => {
    const response = await http.get<ApiResponse<any[]>>(BASE_URL, authHeader(accessToken));
    const raw = response.payload?.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map(mapToEngagement);
  },

  cancelEngagement: async (id: string, accessToken: string): Promise<Engagement> => {
    const response = await http.patch<ApiResponse<any>>(
      `${BASE_URL}/${id}/cancel`,
      {},
      authHeader(accessToken)
    );
    return mapToEngagement(response.payload.data);
  },
};
