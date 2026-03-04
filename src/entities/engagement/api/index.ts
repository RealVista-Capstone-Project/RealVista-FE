import http from '@/shared/lib/http';
import { ApiResponse } from '@/shared/types/api-response';
import { Engagement } from '../model/types';
import { mapToEngagement } from '../lib/engagement.mapper';

const BASE_URL = '/engagements';

export const engagementApi = {
  getMyEngagements: async (): Promise<Engagement[]> => {
    const response = await http.get<ApiResponse<any[]>>(BASE_URL);
    return response.payload.data.map(mapToEngagement);
  },

  cancelEngagement: async (id: string): Promise<Engagement> => {
    const response = await http.patch<ApiResponse<any>>(`${BASE_URL}/${id}/cancel`, {});
    return mapToEngagement(response.payload.data);
  },
};
