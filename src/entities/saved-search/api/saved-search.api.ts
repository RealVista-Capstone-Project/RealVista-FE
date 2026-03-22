import http from '@/shared/lib/http';
import type { ApiResponse } from '@/shared/types/api-response';
import type { SavedSearchDto, SaveSearchRequest } from './saved-search-api.types';

export const savedSearchApi = {
  getAll: () => http.get<ApiResponse<SavedSearchDto[]>>('/saved-searches'),

  save: (body: SaveSearchRequest) =>
    http.post<ApiResponse<SavedSearchDto>>('/saved-searches', body),

  delete: (id: string) => http.delete<ApiResponse<void>>(`/saved-searches/${id}`),
} as const;
